define([
    "dojo/_base/declare",
    "esriviewer/manager/base/WebMapTemplateConfigurationUtil",
    "dojo/_base/lang"
],
    function (declare, WebMapTemplateConfigurationUtil, lang) {
        return  declare(
            [WebMapTemplateConfigurationUtil],
            {
                displayFieldsParameter: "imageResultDisplayFields",
                whereClauseAppendParameter: "whereClauseAppend",
                //portal configuration entries that are specifically for the discovery viewer
                imageryParameters: [ "imageResultDisplayFields", "whereClauseAppend", "imageryViewer"],

                constructor: function () {
                    //add the imagery viewer specific widgets
                    this.appConfigToViewerWidgetConfigLookup.swipeWidget = "swipeWidget";
                },
                init: function () {
                    this.ignoreProcessingConfigurationEntries = this.ignoreProcessingConfigurationEntries.concat(this.imageryParameters);
                },
                finalizeLoad: function () {
                    this.viewerConfiguration.toolsAccordion = {
                        create: true,
                        showTabInNavigation: false
                    };
                    this.viewerConfiguration.footerTogglerWidget = {
                        create: true
                    };
                    this.viewerConfiguration.toolsBar.showExtentActions = false;

                    this.deferred.resolve({viewerConfig: this.viewerConfiguration, imageryConfig: this.imageryConfiguration});
                },
                _createImageryConfig: function () {
                    this.imageryConfiguration = this._applicationConfigurationToImageryConfiguration(this.defaultConfiguration.values);
                },
                handleWebMapItemLoaded: function (webMapItem) {
                    //make sure the web map item exists, read the operational laeyers off of the web map item
                    //image services will be registered as searchable catalog services in the viewer
                    if (webMapItem != null && lang.isObject(webMapItem)) {
                        if (webMapItem.itemData != null && lang.isObject(webMapItem.itemData)) {
                            var itemData = webMapItem.itemData;
                            if (itemData.operationalLayers != null && lang.isArray(itemData.operationalLayers)) {
                                var currOpLayer;
                                var currServiceType;
                                this.webMapQueryLayerItems = [];
                                var addedSearchServiceUrls = {};
                                var currentOpLayerUrlLower;
                                for (var i = 0; i < itemData.operationalLayers.length; i++) {
                                    currOpLayer = itemData.operationalLayers[i];
                                    currentOpLayerUrlLower = currOpLayer.url.toLowerCase();
                                    if (addedSearchServiceUrls[currentOpLayerUrlLower] == null) {
                                        currServiceType = VIEWER_UTILS.getServiceTypeFromUrl(currOpLayer.url);
                                        if (currServiceType === VIEWER_GLOBALS.SERVICE_TYPES.IMAGE_SERVER) {
                                            //this is the search image service
                                            this.webMapQueryLayerItems.push({label: currOpLayer.title, url: currOpLayer.url, supportsThumbnails: true});
                                            addedSearchServiceUrls[currentOpLayerUrlLower] = currOpLayer.url;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    this._createImageryConfig();
                    this.inherited(arguments);
                },
                _applicationConfigurationToImageryConfiguration: function (imageryDefaultConfiguration) {
                    //this takes the portal config.json file and converts it into the json configuration format the discovery application expects
                    var i;
                    var imageryConfiguration = {
                        imageQueryLayers: this.webMapQueryLayerItems,
                        imageQueryResultDisplayFields: [],
                        searchConfiguration: {
                            "allowCheckAllSearchResultThumbnails": false,
                            "footprintZoomLevelStart": 13
                        }
                    };
                    for (var key in imageryDefaultConfiguration) {
                        if (key === this.whereClauseAppendParameter) {
                            var whereClauseAppend = this.appConfig[this.whereClauseAppendParameter] != null ? this.appConfig[this.whereClauseAppendParameter] : imageryDefaultConfiguration[key];
                            for (i = 0; i < this.webMapQueryLayerItems.length; i++) {
                                this.webMapQueryLayerItems[i].queryWhereClauseAppend = whereClauseAppend;
                            }
                        }

                        else if (key === this.displayFieldsParameter) {
                            var displayFieldsString = this.appConfig[this.displayFieldsParameter] != null ? this.appConfig[this.displayFieldsParameter] : imageryDefaultConfiguration[key];
                            var displayFieldsArray = displayFieldsString.replace(/\s+/g, "").split(",");
                            var currentFieldName;
                            for (i = 0; i < displayFieldsArray.length; i++) {
                                currentFieldName = displayFieldsArray[i];
                                imageryConfiguration.imageQueryResultDisplayFields.push({
                                    field: currentFieldName,
                                    label: currentFieldName,
                                    filter: {
                                        enable: true
                                    }
                                });
                            }
                        }
                    }
                    for (var key in imageryDefaultConfiguration.imageryViewer) {
                        imageryConfiguration[key] = imageryDefaultConfiguration.imageryViewer[key];
                    }
                    return imageryConfiguration;
                }
            });
    });