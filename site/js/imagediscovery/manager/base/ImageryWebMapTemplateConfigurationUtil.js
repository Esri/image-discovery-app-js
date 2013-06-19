define([
    "dojo/_base/declare",
    "esriviewer/manager/base/WebMapTemplateConfigurationUtil",
    "dojo/_base/lang",
    "dojo/_base/array"
],
    function (declare, WebMapTemplateConfigurationUtil, lang, array) {
        return  declare(
            [WebMapTemplateConfigurationUtil],
            {
                //  catalogServiceUrlParameter: "imageServiceUrl",
                displayFieldsParameter: "imageResultDisplayFields",
                maxResultsParameter: "maxResults",
                whereClauseAppendParameter: "whereClauseAppend",
                //  imageryParameters: ["imageServiceUrl", "imageResultDisplayFields", "maxResults", "whereClauseAppend"],
                imageryParameters: [ "imageResultDisplayFields", "maxResults", "whereClauseAppend"],
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
                    //      this.viewerConfiguration.header.display = false;
                    this.deferred.resolve({viewerConfig: this.viewerConfiguration, imageryConfig: this.imageryConfiguration});
                },
                _createImageryConfig: function () {
                    var imageryDefaultConfiguration = {};
                    var currentFieldValue;
                    for (var key in this.templateResponse.values) {
                        if (array.indexOf(this.imageryParameters, key) > -1) {
                            currentFieldValue = this.templateResponse.values[key];
                            imageryDefaultConfiguration[key] = currentFieldValue;
                        }
                    }
                    this.imageryConfiguration = this._applicationConfigurationToImageryConfiguration(imageryDefaultConfiguration);
                    this.imageryConfiguration = lang.mixin(this.imageryConfiguration, this.templateResponse.values.imageryViewer);
                    //add the webmap
                },
                handleWebMapItemLoaded: function (webMapItem) {
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
                                            this.webMapQueryLayerItems.push({label: currOpLayer.title, url: currOpLayer.url});
                                            addedSearchServiceUrls[currentOpLayerUrlLower] =  currOpLayer.url;
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
                    var hasWebMapQueryLayer = false;
                    var i;
                    var queryLayerItems;
                    if (this.webMapQueryLayerItems != null && lang.isArray(this.webMapQueryLayerItems) && this.webMapQueryLayerItems.length > 0) {
                        queryLayerItem = this.webMapQueryLayerItems;
                        hasWebMapQueryLayer = true;
                    }
                    else {
                        queryLayerItem = [
                            {label: "Catalog"}
                        ];
                    }
                    var imageryConfiguration = {
                        imageQueryLayers: this.webMapQueryLayerItems,
                        imageQueryResultDisplayFields: [],
                        searchConfiguration: {
                            "maxQueryResults": 100,
                            "allowCheckAllSearchResultThumbnails": false
                        }
                    };
                    for (var key in imageryDefaultConfiguration) {
                        if (key === this.whereClauseAppendParameter) {
                            for (i = 0; i < this.webMapQueryLayerItems.length; i++) {
                                this.webMapQueryLayerItems[i].queryWhereClauseAppend = imageryDefaultConfiguration[key];
                            }
                        }
                        else if (key === this.maxResultsParameter) {
                            var maxResults = imageryDefaultConfiguration[key];
                            if (maxResults != null) {
                                imageryConfiguration.searchConfiguration.maxQueryResults = parseInt(maxResults, 10);
                            }
                        }
                        else if (key === this.displayFieldsParameter) {
                            var displayFieldsArray = imageryDefaultConfiguration[key].replace(/\s+/g, "").split(",");
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
                    return imageryConfiguration;
                }
            });
    });