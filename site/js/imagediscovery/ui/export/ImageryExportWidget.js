define([
        "dojo/_base/declare",
        "dojo/text!./template/ImageryExportTemplate.html",
        //   "xstyle/css!./theme/ImageryExportTheme.css",
        "dojo/topic",
        "dojo/_base/json",
        "dojo/_base/array",
        "dojo/_base/lang",
        "dojo/_base/Color",
        "esriviewer/base/DataLoaderSupport",
        "esriviewer/ui/base/UITemplatedWidget",
        "esriviewer/ui/draw/base/MapDrawSupport",
        "./ImageryExportDownloadWindow",
        "./model/ImageryExportViewModel",
        "dijit/form/Button",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/IdentityManager"
    ],
    //  function (declare, template, theme, topic, json,array, lang, Color, DataLoaderSupport, UITemplatedWidget, MapDrawSupport, ImageryExportDownloadWindow, ImageExportViewModel, Button, SimpleFillSymbol, SimpleLineSymbol) {
    function (declare, template, topic, json, array, lang, Color, DataLoaderSupport, UITemplatedWidget, MapDrawSupport, ImageryExportDownloadWindow, ImageryExportViewModel, Button, SimpleFillSymbol, SimpleLineSymbol, IdentityManager) {
        return declare(
            [UITemplatedWidget, MapDrawSupport, DataLoaderSupport],
            {
                downloadLimitExceedServerDetailString: "The requested number of download images exceeds the limit.",
                bytesInMB: 1048576,
                templateString: template,
                imageryExportDownloadWindowTitle: "Your Files Have Been Prepared",
                actionButtonLabel: "Generate",
                constructor: function () {
                    this.pendingDownloadRequests = 0;
                    this.currentDownloadResponses = [];
                    this.hasDownloadItems = false;
                },
                envelopeSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([0, 128, 0]), 1),
                    new Color([255, 0, 0, .5])),
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new ImageryExportViewModel();
                    this.viewModel.selectedExtractMode.subscribe(lang.hitch(this, this.handleExportTypeSelectChange));
                    this.viewModel.userDrawActive.subscribe(lang.hitch(this, this.handleUserDrawActiveChanged));
                    this.handleImageryDownloadErrorCallback = lang.hitch(this, this._imageryDownloadErrorCallback);

                    ko.applyBindings(this.viewModel, this.domNode);
                },
                initListeners: function () {
                    this.inherited(arguments);
                    this.on("annotationCreated", lang.hitch(this, this.handleAnnotationCreatedFromUser));
                },
                handleAnnotationCreatedFromUser: function (annoObj) {
                    this.currentDrawGraphic = annoObj.graphic;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.ADD, this.currentDrawGraphic);
                    this.viewModel.userDrawActive(false);
                },
                clearDraw: function () {
                    this.inherited(arguments);
                    if (this.currentDrawGraphic) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.REMOVE, this.currentDrawGraphic);
                    }
                    this.currentDrawGraphic = null;
                    //get zoom back for shift key
                    topic.publish(VIEWER_GLOBALS.EVENTS.DRAW.USER.DRAW_CANCEL);
                },
                handleExportTypeSelectChange: function (value) {
                    if (value != this.viewModel.draw) {
                        this.clearDraw();
                    }
                },
                handleUserDrawActiveChanged: function (active) {
                    if (active) {
                        this.handleDrawRectangle();
                    }
                    else {
                        if (this.currentDrawGraphic == null) {
                            this.clearDraw();
                        }
                    }
                },
                handleDrawRectangle: function () {
                    this.clearDraw();
                    this.setDraw(VIEWER_GLOBALS.EVENTS.MAP.TOOLS.DRAW_RECTANGLE);
                },
                /**
                 * handles the bulk of the imagery export
                 */
                handleExport: function () {
                    var selectedObjectIds = this.getDownloadObjectIds();
                    if (selectedObjectIds == null || !lang.isArray(selectedObjectIds) || selectedObjectIds.length == 0) {
                        return;
                    }
                    //get the map extent
                    var extent = null;
                    if (this.viewModel.selectedExtractMode() === this.viewModel.viewerExtent) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.GET_EXTENT, function (ext) {
                            extent = ext;
                        });
                        if (extent == null) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not retrieve map extent");
                            VIEWER_UTILS.log("Could not retrieve map extent for export", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                            return;
                        }
                    }
                    else if (this.viewModel.selectedExtractMode() === this.viewModel.draw) {
                        if (this.currentDrawGraphic == null) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Clip extent required");
                            VIEWER_UTILS.log("Could not generate report. A Clip extent is required", VIEWER_GLOBALS.LOG_TYPE.WARNING);
                            return;
                        }
                        else {
                            extent = this.currentDrawGraphic.geometry;
                        }
                    }
                    else if (this.viewModel.selectedExtractMode() === this.viewModel.worldExtent) {
                        extent = null;
                    }
                    else {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Unknown Extract Mode");
                        VIEWER_UTILS.log("Unknown Extract Mode", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return;
                    }
                    var cred, currentQueryLayer,
                        currentSelectedObject,
                        currentQueryLayerController,
                        downloadRequests = [],
                        i;
                    for (i = 0; i < selectedObjectIds.length; i++) {
                        currentSelectedObject = selectedObjectIds[i];
                        currentQueryLayerController = currentSelectedObject.queryController ? currentSelectedObject.queryController : null;
                        if (currentSelectedObject == null || currentQueryLayerController == null) {
                            continue;
                        }
                        currentQueryLayer = currentQueryLayerController.layer;
                        if (IMAGERY_UTILS.layerSupportsDownload(currentQueryLayer)) {
                            //call the download
                            var downloadParams = {
                                f: "json",
                                rasterIds: currentSelectedObject.objectIds.join(",")

                            };
                            if (extent != null) {
                                downloadParams.geometry = json.toJson(extent.toJson());
                                downloadParams.geometryType = VIEWER_GLOBALS.ESRI_GEOMETRY_TYPES.ENVELOPE;
                            }
                            cred = IdentityManager.findCredential(currentQueryLayer.url);
                            if (cred && cred.token) {
                                downloadParams.token = cred.token;
                            }
                            downloadRequests.push({layer: currentQueryLayer, downloadParameters: downloadParams});
                        }
                    }
                    if (downloadRequests.length > 0) {
                        var currentDownloadRequest;
                        var downloadUrl;
                        this.hasDownloadItems = false;
                        this.currentDownloadResponses = [];
                        this.pendingDownloadRequests = downloadRequests.length;
                        //loop through the download requests and send the download request as jsonp
                        for (i = 0; i < downloadRequests.length; i++) {
                            currentDownloadRequest = downloadRequests[i];
                            downloadUrl = VIEWER_UTILS.joinUrl(currentDownloadRequest.layer.url, "download");
                            this.loadJsonP(downloadUrl, currentDownloadRequest.downloadParameters, lang.hitch(this, this._imageryDownloadResponseCallback, currentDownloadRequest.layer), this.handleImageryDownloadErrorCallback);
                        }
                        this.clearDraw();
                    }
                },
                _imageryDownloadErrorCallback: function (error) {
                    var errString = "An error was encountered during export.";
                    if (error && lang.isArray(error.details) && error.details.length > 0) {
                        if (array.indexOf(error.details, this.downloadLimitExceedServerDetailString) > -1) {
                            errString = "Cannot export imagery. Download limit exceeded on server."
                        }
                    }
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, errString);
                    VIEWER_UTILS.log(errString, VIEWER_GLOBALS.LOG_TYPE.ERROR);
                },
                _imageryDownloadResponseCallback: function (layer, response) {
                    if (response == null || layer == null || response.rasterFiles == null || response.rasterFiles.length == 0) {
                        if (this.currentDownloadResponses.length == --this.pendingDownloadRequests) {
                            this._imageryDownloadComplete();
                        }
                        return;
                    }
                    //there are items to download in this result
                    this.hasDownloadItems = true;
                    this.currentDownloadResponses.push({response: response, layer: layer});
                    if (this.currentDownloadResponses.length == this.pendingDownloadRequests) {
                        this._imageryDownloadComplete();
                    }
                },
                /**
                 * finalizes the imagery export
                 * @private
                 */
                _imageryDownloadComplete: function () {
                    if (!this.hasDownloadItems) {
                        if (this.imageryExportDownloadWindow) {
                            this.imageryExportDownloadWindow.hide();
                        }
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "No imagery Was returned from export request");
                        VIEWER_UTILS.log("No imagery Was returned from export request", VIEWER_GLOBALS.LOG_TYPE.INFO);
                        return;

                    }
                    if (this.imageryExportDownloadWindow == null) {
                        this.imageryExportDownloadWindow = new ImageryExportDownloadWindow({
                            windowHeaderText: this.imageryExportDownloadWindowTitle,
                            windowIconAltText: this.imageryExportDownloadWindowTitle
                        });
                    }
                    var i, j, cred, fileName, downloadServiceItems = {}, currentRasterFile, currrentRasterFileRasterId, filesAddedCounter = 1, currentDownloadResponseObject, currentResponse, downloadUrl, serviceUrl;
                    //loop through download responses and format all download URLs and finally add to the download items array
                    for (i = 0; i < this.currentDownloadResponses.length; i++) {
                        currentDownloadResponseObject = this.currentDownloadResponses[i];
                        if (currentDownloadResponseObject.layer == null || currentDownloadResponseObject.response == null) {
                            continue;
                        }
                        var downloadItems = [];
                        downloadServiceItems[currentDownloadResponseObject.layer.name] = downloadItems;
                        currentResponse = currentDownloadResponseObject.response;
                        for (j = 0; j < currentResponse.rasterFiles.length; j++) {
                            currentRasterFile = currentResponse.rasterFiles[j];
                            if (currentRasterFile == null || currentRasterFile.id == null || currentRasterFile.rasterIds == null ||
                                currentRasterFile.rasterIds.length == 0) {
                                continue;
                            }
                            serviceUrl = currentDownloadResponseObject.layer.url;
                            if (currentRasterFile.id.indexOf("://") > -1) {
                                downloadUrl = currentRasterFile.id.replace(/\\/g, "/");
                                fileName = downloadUrl.substring(downloadUrl.lastIndexOf("/") + 1, downloadUrl.length);
                            }
                            else {
                                fileName = VIEWER_UTILS.getFileNameFromAtEndOfPath(currentRasterFile.id);
                                currrentRasterFileRasterId = currentRasterFile.rasterIds[0];
                                downloadUrl = VIEWER_UTILS.joinUrl(serviceUrl, ("file?id=" + currentRasterFile.id));
                                downloadUrl += "&rasterId=" + currrentRasterFileRasterId;
                                cred = IdentityManager.findCredential(serviceUrl);
                                if (cred && cred.token) {
                                    downloadUrl += "&token=" + cred.token;
                                }

                            }
                            if (fileName == null || fileName == "") {
                                fileName = currentRasterFile.id ? currentRasterFile.id : ("File " + filesAddedCounter);
                            }
                            if (currentRasterFile.rasterIds.length == 1) {
                                currrentRasterFileRasterId = currentRasterFile.rasterIds[0];
                                var addDownloadItem = {
                                    id: VIEWER_UTILS.generateUUID(),
                                    url: downloadUrl,
                                    label: fileName,
                                    serviceName: REG_EXP_UTILS.getServiceNameFromUrl(serviceUrl)
                                };
                                if (currentRasterFile.size != null) {
                                    addDownloadItem.size = REG_EXP_UTILS.numberToStringWithCommas((currentRasterFile.size / this.bytesInMB).toFixed(2) + " MB");
                                }
                                else {
                                    addDownloadItem.size = "? MB"
                                }
                                downloadItems.push(addDownloadItem);
                            }
                        }
                    }
                    this.imageryExportDownloadWindow.show(downloadServiceItems);
                }
            });
    });
