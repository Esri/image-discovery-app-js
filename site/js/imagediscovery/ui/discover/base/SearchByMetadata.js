define([
        "dojo/_base/declare",
        "dojo/text!./templates/SearchByMetadataTemplate.html",
        "./BaseSearchByWidget",
        "dijit/form/FilteringSelect",
        "dijit/form/RadioButton",
        "esriviewer/base/DataLoaderSupport",
        "dojo/store/Memory",
        "dojo/topic",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/_base/lang",
        "esri/tasks/QueryTask" ,
        "esri/tasks/query",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "dojo/_base/Color",
        "esri/graphic",
        "esri/geometry/Point",
        "esri/geometry/Polygon",
        "esri/geometry/Polyline",
        "esri/geometry/Extent",
        "dojo/dom-attr"

    ],
    function (declare, template, BaseSearchByWidget, FilteringSelect, RadioButton, DataLoaderSupport, Memory, topic, domConstruct, domStyle, lang, QueryTask, Query, SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, Color, Graphic, Point, Polygon, Polyline, Extent, domAttr) {
        return declare(
            [ BaseSearchByWidget, DataLoaderSupport],
            {
                templateString: template,
                postCreate: function () {
                    this.inherited(arguments);
                    var mapRef;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GET, function (responseMap) {
                        mapRef = responseMap;
                    });
                    this.map = mapRef;
                    this.initSymbology();
                },
                loadViewerConfigurationData: function () {
                    //load the configuration
                    var metadataConfig;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageQueryMetadataConfiguration", function (metadataConf) {
                        metadataConfig = metadataConf;
                    });
                    if (metadataConfig) {
                        if (metadataConfig.metadataDetailsLabel) {
                            domAttr.set(this.metadataDetailsLabel, "innerHTML", metadataConfig.metadataDetailsLabel);
                        }
                        if (metadataConfig.url) {
                            this.loadJsonP(metadataConfig.url, {f: "json"}, lang.hitch(this, this.handleMetadataConfigLoaded));
                        }
                    }
                },
                handleMetadataConfigLoaded: function (config) {
                    if (!config || !config.metadataLayers || !config.metadataLayers.length) {
                        return;
                    }
                    var i;
                    this.metadataSearchObjects = {};
                    var newMetadataSearchObject;
                    var key;
                    var count = 0;
                    for (i = 0; i < config.metadataLayers.length; i++) {
                        newMetadataSearchObject = this.createMetadataSearchObject(config.metadataLayers[i]);
                        if (newMetadataSearchObject) {
                            this.metadataSearchObjects[newMetadataSearchObject._id] = newMetadataSearchObject;
                            count++;
                        }
                    }
                    if (count === 1) {
                        this.currentMetadataSearchObject = newMetadataSearchObject;
                        this.currentMetadataSearchObject.metadataSelect.placeAt(this.metadataSelectFilter);
                        this.currentMetadataSearchObject.metadataSelect.startup();

                    }
                    else {
                        var currentMetadataSearchObject;
                        var currentMetadataRadioButton;
                        var currentSelectFilterContainer;
                        var checked = true;
                        for (key in this.metadataSearchObjects) {
                            if (this.metadataSearchObjects.hasOwnProperty(key)) {
                                currentMetadataSearchObject = this.metadataSearchObjects[key];
                                currentMetadataRadioButton = new RadioButton({
                                    checked: checked,
                                    value: key,
                                    name: "discoveryMetadataRadio"
                                });
                                currentMetadataRadioButton.on("click", lang.hitch(this, this.handleRadioSelectionChanged, key));
                                currentMetadataSearchObject.searchFilterContainer = domConstruct.create("div");

                                domConstruct.place(currentMetadataSearchObject.searchFilterContainer, this.metadataSelectFilter);
                                currentMetadataSearchObject.metadataSelect.placeAt(currentMetadataSearchObject.searchFilterContainer);
                                if (!checked) {
                                    domStyle.set(currentMetadataSearchObject.searchFilterContainer, "display", "none");
                                }
                                else {
                                    this.currentMetadataSearchObject = currentMetadataSearchObject;
                                }
                                checked = false;
                                currentMetadataRadioButton.placeAt(this.metadataRadioButtonsContainer);
                                domConstruct.place(domConstruct.create("span", {innerHTML: currentMetadataSearchObject.label, style: {marginRight: "5px"} }), this.metadataRadioButtonsContainer);
                            }
                        }
                    }
                },
                handleRadioSelectionChanged: function (searchObjectId) {
                    if (this.currentMetadataSearchObject && this.currentMetadataSearchObject._id !== searchObjectId) {
                        domStyle.set(this.currentMetadataSearchObject.searchFilterContainer, "display", "none");
                    }
                    if (this.currentMetadataSearchObject._id === searchObjectId) {
                        return;
                    }
                    this.currentMetadataSearchObject = this.metadataSearchObjects[searchObjectId];
                    if (this.currentMetadataSearchObject) {
                        domStyle.set(this.currentMetadataSearchObject.searchFilterContainer, "display", "block");
                    }


                },
                createMetadataSearchObject: function (searchLayer) {
                    if (!searchLayer.queryField || !searchLayer.layerUrl || !searchLayer.data) {
                        return;
                    }
                    return {
                        _id: VIEWER_UTILS.generateUUID(),
                        queryField: searchLayer.queryField,
                        layerUrl: searchLayer.layerUrl,
                        label: searchLayer.label || "Label",
                        metadataSelect: new FilteringSelect({
                            required: false,
                            style: {
                                width: "85%"
                            },
                            store: new Memory({
                                idProperty: "name",
                                label: "name",
                                data: searchLayer.data
                            })
                        })
                    };
                },
                initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.handleResultsCleared));
                },
                handleResultsCleared: function () {
                    if (this.currentMetadataGraphic) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.REMOVE, this.currentMetadataGraphic);
                        this.currentMetadataGraphic = null;
                    }
                },
                initSymbology: function () {
                    //init the discovery widget symbology
                    this.polygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([0, 255, 255]), 1), new Color([0, 255, 255, 0]));
                    this.pointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_X, 1,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color("blue")));
                    this.polylineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([0, 255, 255]), 1);

                    this.envelopeSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([0, 255, 255]), 1),
                        new Color([0, 0, 0, 0]));
                },

                searchMetadata: function () {
                    if (!this.currentMetadataSearchObject) {
                        return;
                    }
                    var searchValue = this.currentMetadataSearchObject.metadataSelect.get("value");
                    if (!searchValue) {
                        return;
                    }
                    if (!this.currentMetadataSearchObject.queryTask) {
                        this.currentMetadataSearchObject.queryTask = new QueryTask(this.currentMetadataSearchObject.layerUrl);

                    }
                    var resultFeature, query = new Query();
                    query.where = this.currentMetadataSearchObject.queryField + " = '" + searchValue + "'";
                    query.outSpatialReference = this.map.extent.spatialReference;
                    query.returnGeometry = true;
                    this.currentMetadataSearchObject.queryTask.execute(query, lang.hitch(this, function (results) {
                        if (results && results.features && results.features.length > 0) {
                            resultFeature = results.features[0];
                            if (resultFeature.geometry) {
                                var extent =  resultFeature.geometry.getExtent();
                                if(extent) {
                                    if (Math.abs(extent.xmax - extent.xmin) < 1000){
                                        extent.xmax += 500;
                                        extent.xmin -= 500;
                                    }
                                    if (Math.abs(extent.ymax - extent.ymin) < 1000){
                                        extent.ymax += 500;
                                        extent.ymin -= 500;
                                    }
                                    this.map.setExtent(extent);
                                }
                                this._onSearchByGeometry(resultFeature.geometry);
                                if (resultFeature.geometry instanceof Point) {
                                    this.currentMetadataGraphic = new Graphic(resultFeature.geometry, this.pointSymbol);
                                }
                                else if (resultFeature.geometry instanceof Polygon) {
                                    this.currentMetadataGraphic = new Graphic(resultFeature.geometry, this.polygonSymbol);
                                }
                                else if (resultFeature.geometry instanceof Polyline) {
                                    this.currentMetadataGraphic = new Graphic(resultFeature.geometry, this.polylineSymbol);
                                }
                                else if (resultFeature.geometry instanceof Extent) {
                                    this.currentMetadataGraphic = new Graphic(resultFeature.geometry, this.polygonSymbol);
                                }
                                else {
                                    this.currentMetadataGraphic = null;
                                }
                                if (this.currentMetadataGraphic) {
                                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.ADD, this.currentMetadataGraphic);
                                }
                            }
                        }
                    }));
                },
                _onSearchByGeometry: function (geometry) {
                    this.onSearchByGeometry(geometry);
                },
                onSearchByGeometry: function (geometry) {
                }
            });
    });



