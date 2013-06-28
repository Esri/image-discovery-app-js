define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageryExportTemplate.html",
    "xstyle/css!./theme/ImageryExportTheme.css",
    "dojo/topic",
    "dojo/_base/json",
    "dojo/_base/lang",
    "dojo/_base/Color",
    "esriviewer/base/DataLoaderSupport",
    "esriviewer/ui/base/UITemplatedWidget",
    "esriviewer/ui/draw/base/MapDrawSupport",
    "./ImageryExportDownloadWindow",
    "./model/ImageryExportViewModel",
    "dijit/form/Button",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol"
],
    function (declare, template,theme, topic, json, lang, Color, DataLoaderSupport, UITemplatedWidget, MapDrawSupport, ImageryExportDownloadWindow, ImageExportViewModel, Button, SimpleFillSymbol, SimpleLineSymbol) {
        return declare(
            [ UITemplatedWidget, MapDrawSupport, DataLoaderSupport],
            {
                bytesInMB: 1048576,
                templateString: template,
                imageryExportDownloadWindowTitle: "Your Files Have Been Prepared",
                actionButtonLabel: "Generate",
                constructor: function () {
                    this.pendingDownloadRequests = 0;
                    this.currentDownloadResponses = [];
                    this.hasDownloadItems = false;
                },
                envelopeSymbol: new SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL,
                    new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                        new Color([0, 128, 0]), 1),
                    new Color([255, 0, 0, .5])),
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new ImageExportViewModel();
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
                handleExport: function () {
                    var selectedObjectIds = this.getDownloadObjectIds();
                    if (selectedObjectIds == null || !lang.isArray(selectedObjectIds) || selectedObjectIds.length == 0) {
                        return;
                    }
                    //get the map extent
                    var extent;
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
                    var currentQueryLayer;
                    var currentSelectedObject;
                    var currentQueryLayerController;
                    var downloadRequests = [];
                    var i;
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
                            downloadRequests.push({layer: currentQueryLayer, downloadParameters: downloadParams});
                        }
                    }
                    if (downloadRequests.length > 0) {
                        var currentDownloadRequest;
                        var downloadUrl;
                        this.hasDownloadItems = false;
                        this.currentDownloadResponses = [];
                        this.pendingDownloadRequests = downloadRequests.length;
                        for (i = 0; i < downloadRequests.length; i++) {
                            currentDownloadRequest = downloadRequests[i];
                            downloadUrl = VIEWER_UTILS.joinUrl(currentDownloadRequest.layer.url, "download");
                            this.loadJsonP(downloadUrl, currentDownloadRequest.downloadParameters, lang.hitch(this, this._imageryDownloadResponseCallback, currentDownloadRequest.layer), this.handleImageryDownloadErrorCallback);
                        }
                        this.clearDraw();
                    }
                },
                _imageryDownloadErrorCallback: function (error) {
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "An error was encountered during export");
                    VIEWER_UTILS.log("An error was encountered during export", VIEWER_GLOBALS.LOG_TYPE.ERROR);
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
                    var downloadServiceItems = {};
                    var currentRasterFile;
                    var currrentRasterFileRasterId;
                    var filesAddedCounter = 1;
                    var currentDownloadResponseObject;
                    var currentResponse;
                    for (var i = 0; i < this.currentDownloadResponses.length; i++) {
                        currentDownloadResponseObject = this.currentDownloadResponses[i];
                        if (currentDownloadResponseObject.layer == null || currentDownloadResponseObject.response == null) {
                            continue;
                        }
                        var downloadItems = [];
                        downloadServiceItems[currentDownloadResponseObject.layer.name] = downloadItems;
                        currentResponse = currentDownloadResponseObject.response;
                        for (var j = 0; j < currentResponse.rasterFiles.length; j++) {
                            currentRasterFile = currentResponse.rasterFiles[j];
                            if (currentRasterFile == null || currentRasterFile.id == null || currentRasterFile.rasterIds == null ||
                                currentRasterFile.rasterIds.length == 0) {
                                continue;
                            }
                            var fileName = VIEWER_UTILS.getFileNameFromAtEndOfPath(currentRasterFile.id);
                            if (fileName == null || fileName == "") {
                                fileName = currentRasterFile.id ? currentRasterFile.id : ("File " + filesAddedCounter);
                            }
                            var downloadUrl = VIEWER_UTILS.joinUrl(currentDownloadResponseObject.layer.url, ("file?id=" + currentRasterFile.id));
                            if (currentRasterFile.rasterIds.length == 1) {
                                currrentRasterFileRasterId = currentRasterFile.rasterIds[0];
                                var addDownloadItem = {
                                    url: (downloadUrl + "&rasterId=" + currrentRasterFileRasterId),
                                    label: fileName
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