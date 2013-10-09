define([
    "dojo/_base/declare",
    "dojo/text!./template/GeometryUploadWidgetTemplate.html",
  //  "xstyle/css!./theme/GeometryUploadTheme.css",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/dom-attr",
    "esriviewer/ui/base/UITemplatedWidget",
    "dijit/form/Button",
    "esri/request",
    "esri/tasks/Geoprocessor",
    "esri/tasks/DataFile",
    "esri/geometry/Extent"
],
   // function (declare, template, theme, topic, lang, domAttr, UITemplatedWidget, Button, esriRequest, Geoprocessor, DataFile, Extent) {
    function (declare, template,  topic, lang, domAttr, UITemplatedWidget, Button, esriRequest, Geoprocessor, DataFile, Extent) {
        return declare(
            [UITemplatedWidget],
            {
                KML: "kml",
                KMZ: "kmz",
                ZIP: "zip",
                geoprocessingTaskUrl: "",
                templateString: template,
                postCreate: function () {
                    this.inherited(arguments);
                    this.geometryGeoprocessingSuccessCallback = lang.hitch(this, this._handleGeoprocessingSuccess);
                    this.geometryGeoprocessingErrorCallback = lang.hitch(this, this.handleGeoprocessingError);
                    this.handleUploadFeaturesResponseCallback = lang.hitch(this, this.handleProcessUploadFeatures);

                    //disable the upload button
                    this.geometryUploadButton.set("disabled", true);
                },
                loadViewerConfigurationData: function () {
                    //load the configuration
                    var imageDiscoverySearchConfiguration;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "searchConfiguration", function (imageDiscoverySearchConf) {
                        imageDiscoverySearchConfiguration = imageDiscoverySearchConf;
                    });
                    var discoveryGeometryUploadConfiguration;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "discoverGeometryUploadTask", function (discoveryGeometryUploadConf) {
                        discoveryGeometryUploadConfiguration = discoveryGeometryUploadConf;
                    });
                    if (discoveryGeometryUploadConfiguration != null && lang.isObject(discoveryGeometryUploadConfiguration)) {
                        this.geometryUploadTaskConfiguration = discoveryGeometryUploadConfiguration;
                    }
                },
                /**
                 * called when an upload of geometry has been requested in the view
                 */
                handleGeometryUpload: function () {
                    var uploadFilePath = domAttr.get(this.uploadFileInput, "value");
                    if (uploadFilePath == null || uploadFilePath == "") {
                        return;
                    }
                    var fileExtensionLower = VIEWER_UTILS.getFileExtensionLower(uploadFilePath);
                    if (!(fileExtensionLower === this.KML || fileExtensionLower === this.ZIP || fileExtensionLower === this.KMZ)) {
                        return;
                    }
                    if (this.geometryUploadTaskConfiguration != null && this.geometryUploadTaskConfiguration.uploadUrl) {
                        VIEWER_UTILS.log("Uploading File: " + uploadFilePath, VIEWER_GLOBALS.LOG_TYPE.INFO);
                        var uploadRequest = esriRequest({
                            url: this.geometryUploadTaskConfiguration.uploadUrl,
                            form: this.fileUploadForm,
                            handleAs: "json"
                        }, {
                            useProxy: false});
                        uploadRequest.then(lang.hitch(this, this.handleFileLoad), lang.hitch(this, this.handleFileLoadError));
                    }
                    else {
                        VIEWER_UTILS.log("Geometry upload is missing upload target parameter 'uploadUrl'", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Viewer not configured for upload");
                    }
                },
                /**
                 * called when the geometry file could not be uploaded to the server
                 * @param err
                 */
                handleFileLoadError: function (err) {
                    VIEWER_UTILS.log("Could not upload file", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not upload file");
                },
                /**
                 * called when the geometry file has been uploaded to the server. An item id is returned from ArcGIS Server
                 * @param response
                 */
                handleFileLoad: function (response) {
                    domAttr.set(this.uploadFileInput, "value", "");

                    if (response && lang.isObject(response) && response.item && response.item.itemID) {
                        var itemId = response.item.itemID;
                        //send the gp request
                        this._sendGeometryToEsriFormatRequest(response.item);
                    }
                },
                /**
                 * sends the uploaded item to the discovery applications geoprocessing task that converts the geometries to esri format
                 * @private
                 * @param uploadItem
                 */
                _sendGeometryToEsriFormatRequest: function (uploadItem) {
                    if (this.geometryUploadTaskConfiguration.geoprocessingTaskUrl == null) {
                        alert("geometry upload is missing upload target parameter 'geoprocessingTaskUrl'");
                    }
                    if (this.geometryUploaderGeoprocessingTask == null) {
                        this.geometryUploaderGeoprocessingTask = new Geoprocessor(this.geometryUploadTaskConfiguration.geoprocessingTaskUrl);
                    }
                    var requestParameters = {};
                    var fileParam;
                    var fileExtensionLower = VIEWER_UTILS.getFileExtensionLower(uploadItem.itemName);
                    if (fileExtensionLower === this.KML) {
                        fileParam = this.geometryUploadTaskConfiguration.uploadKMLFileParameterName;
                    }
                    else if (fileExtensionLower === this.ZIP) {
                        fileParam = this.geometryUploadTaskConfiguration.uploadSHPFileParameterName;
                    }
                    else if (fileExtensionLower === this.KMZ) {
                        fileParam = this.geometryUploadTaskConfiguration.uploadKMZFileParameterName;
                    }
                    else {
                        return;
                    }
                    //set the uploaded file item id
                    var uploadedFile = new DataFile();
                    uploadedFile.itemID = uploadItem.itemID;
                    requestParameters[fileParam] = uploadedFile;

                    //set the format
                    // requestParameters[fileParam] = this.uploadFormatSelect.get("value");

                    //get the map spatial reference
                    var mapExtent = null;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.GET_EXTENT, function (ext) {
                        mapExtent = ext
                    });
                    if (mapExtent.spatialReference && mapExtent.spatialReference.wkid != null) {
                        requestParameters[this.geometryUploadTaskConfiguration.spatialReferenceWKIDParameterName] = mapExtent.spatialReference.wkid
                    }

                    if (this.geometryUploadTaskConfiguration.isAsync == null || this.geometryUploadTaskConfiguration.isAsync) {
                        this.geometryUploaderGeoprocessingTask.submitJob(requestParameters, this.geometryGeoprocessingSuccessCallback, null, this.geometryGeoprocessingErrorCallback);
                    }
                    else {
                        this.geometryUploaderGeoprocessingTask.execute(requestParameters, this.geometryGeoprocessingSuccessCallback, this.geometryGeoprocessingErrorCallback);
                    }
                },
                /**
                 *called when the geometry has been converted to esri format by the discovery application geoprocessing endpoint
                 * @param response
                 * @private
                 */
                _handleGeoprocessingSuccess: function (response) {
                    if (response && response.results) {
                        //get the output features
                        if (response.results[this.geometryUploadTaskConfiguration.outputFeaturesParameterName] != null) {
                            if (response.results[this.geometryUploadTaskConfiguration.outputFeaturesParameterName].paramUrl != null) {
                                //need to get the features from the server
                                this.geometryUploaderGeoprocessingTask.getResultData(response.jobId, this.geometryUploadTaskConfiguration.outputFeaturesParameterName, this.handleUploadFeaturesResponseCallback);
                            }
                            else {
                                topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Synchronous GP not implemented for upload.");
                                VIEWER_UTILS.log("Synchronous GP not implemented for upload.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                            }
                        }
                    }
                },
                /**
                 * processes the esri formatted geometries and sets the map extent
                 * @param response
                 */
                handleProcessUploadFeatures: function (response) {
                    if (response && response.value && response.value.features) {
                        //assign symbology and add to map
                        var resultExtent = null;
                        var currentFeature;
                        var newGraphic;
                        var searchGeometries = [];
                        var currentExtent;
                        var i;
                        var count = response.value.features.length;
                        for (i = 0; i < count; i++) {
                            currentFeature = response.value.features[i];
                            currentExtent = currentFeature.geometry.getExtent();

                            if (i != 0) {
                                if (currentExtent.xmin < resultExtent.xmin) {
                                    resultExtent.xmin = currentExtent.xmin;
                                }
                                if (currentExtent.ymin < resultExtent.ymin) {
                                    resultExtent.ymin = currentExtent.ymin;
                                }
                                if (currentExtent.xmax > resultExtent.xmax) {
                                    resultExtent.xmax = currentExtent.xmax;
                                }
                                if (currentExtent.ymax > resultExtent.ymax) {
                                    resultExtent.ymax = currentExtent.ymax;
                                }
                            }
                            else {
                                resultExtent = new Extent(
                                    currentExtent.xmin,
                                    currentExtent.ymin,
                                    currentExtent.xmax,
                                    currentExtent.ymax,
                                    currentExtent.spatialReference
                                )
                            }
                            searchGeometries.push(currentFeature.geometry);
                        }
                        if (resultExtent != null) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.SET_EXTENT, resultExtent);
                        }
                        this.onPerformSearch(searchGeometries);
                    }
                },
                onPerformSearch: function (searchGeometries) {

                },
                /**
                 * called when there was an error sending the upload file to the discovery applications geometry geoprocessor
                 * @param err
                 */
                handleGeoprocessingError: function (err) {
                    VIEWER_UTILS.log("There was an error processing geometry upload", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not upload geometry");
                },
                /**
                 * handles changes in the upload file form element
                 */
                handleFilePathChanged: function () {
                    var uploadFilePath = domAttr.get(this.uploadFileInput, "value");
                    if (uploadFilePath == null || uploadFilePath == "") {
                        this.geometryUploadButton.set("disabled", true);
                    }
                    var fileExtensionLower = VIEWER_UTILS.getFileExtensionLower(uploadFilePath);
                    if (!(fileExtensionLower === this.KML || fileExtensionLower === this.ZIP || fileExtensionLower === this.KMZ)) {
                        this.geometryUploadButton.set("disabled", true);
                    }
                    else {
                        this.geometryUploadButton.set("disabled", false);
                    }
                }
            });
    });