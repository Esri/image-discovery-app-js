define([
        "dojo/_base/declare",
        "dojo/text!./templates/SearchByMetadataTemplate.html",
        "./BaseSearchByWidget",
        "dijit/form/FilteringSelect",
        "esriviewer/base/DataLoaderSupport",
        "dojo/store/Memory",
        "dojo/topic",
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
    function (declare, template, BaseSearchByWidget, FilteringSelect, DataLoaderSupport, Memory, topic, lang, QueryTask, Query, SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, Color, Graphic, Point, Polygon, Polyline, Extent,domAttr) {
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
                        if(metadataConfig.metadataDetailsLabel){
                           domAttr.set(this.metadataDetailsLabel,"innerHTML",metadataConfig.metadataDetailsLabel);
                        }
                        if (metadataConfig.url) {
                            this.loadJsonP(metadataConfig.url, {f: "json"}, lang.hitch(this, this.handleMetadataConfigLoaded));
                        }
                    }
                },
                handleMetadataConfigLoaded: function (config) {
                    this.queryField = config.queryField;
                    this.metadataSearchServiceConfig = config.searchService;
                    this.metadataSelect = new FilteringSelect({
                        maxHeight:300,
                        style: {
                            width: "85%"
                        },
                        store: new Memory({
                            idProperty: "name",
                            label: "name",
                            data: config.data
                        })
                    });
                    this.metadataSelect.placeAt(this.metadataSelectFilter);
                    this.metadataSelect.startup();
                },
                initListeners: function () {

                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.handleResultsCleared));
                },
                handleResultsCleared: function () {
                    console.log("handleResultsCleared");
                    if (this.currentMetadataGraphic) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.REMOVE, this.currentMetadataGraphic);
                        this.currentMetadataGraphic = null;
                    }
                },
                initSymbology: function () {
                    //init the discovery widget symbology
                    this.polygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([79,255,240]), 1), new Color([0, 0, 255, 0]));
                    this.pointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_X, 1,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color("blue")));
                    this.polylineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([79,255,240]), 1);

                    this.envelopeSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([79,255,240]), 1),
                        new Color([0, 0, 0, 0]));
                },

                searchMetadata: function () {
                    var searchValue = this.metadataSelect.get("value");
                    if (!searchValue) {
                        return;
                    }
                    if (!this.queryTask) {
                        this.queryTask = new QueryTask(this.metadataSearchServiceConfig.url);

                    }
                    var resultFeature, query = new Query();
                    query.where = this.queryField + " = '" + searchValue + "'";
                    query.outSpatialReference = this.map.extent.spatialReference;
                    console.log("Where clause: " + query.where);
                    query.returnGeometry = true;
                    this.queryTask.execute(query, lang.hitch(this, function (results) {
                        if (results && results.features && results.features.length > 0) {
                            resultFeature = results.features[0];
                            if (resultFeature.geometry) {
                                this.map.setExtent(resultFeature.geometry.getExtent());
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
                                    console.log("Adding graphic");
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