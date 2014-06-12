define([
    "dojo/_base/declare",
    "dojo/text!./template/GeometrySearcherTemplate.html",
    'dijit/layout/ContentPane',
    "esriviewer/ui/base/UITemplatedWidget",
    "./model/GeometrySearcherViewModel",
    "dojo/request/xhr",
    "dojo/_base/lang",
    "esri/layers/GraphicsLayer",
    "esri/geometry/Polygon",
    "esri/geometry/Extent",
    "esri/graphic",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "dojo/_base/Color",
    "esri/SpatialReference",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/topic" ,
    "../../base/ImageQueryLayerControllerQueryParameters"
],
    function (declare, template, ContentPane, UITemplatedWidget, GeometrySearcherViewModel, xhr, lang, GraphicsLayer, Polygon, Extent, Graphic, SimpleFillSymbol, SimpleLineSymbol, Color, SpatialReference, dom, domStyle, topic, ImageQueryLayerControllerQueryParameters) {
        return declare(
            [ContentPane, UITemplatedWidget],
            {
                title: "Search",
                templateString: template,
                constructor: function (params) {
                    this.resultCache = {};

                    this.defaultSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                            new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]));
                },
                postCreate: function () {
                    this.inherited(arguments);
                    var mapRef;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GET, function (responseMap) {
                        mapRef = responseMap;
                    });
                    this.map = mapRef;


                    this.graphicsLayer = new GraphicsLayer();
                    this.map.addLayer(this.graphicsLayer);

                    this.viewModel = new GeometrySearcherViewModel();
                    ko.applyBindings(this.viewModel, this.domNode);
                    var self = this;
                    this.viewModel.on("performSearch", lang.hitch(this, this.performSearch));
                    this.viewModel.on("clearResults", lang.hitch(this, this.handleManualClear));
                    this.viewModel.on("zoomTo", lang.hitch(this, this.zoomTo));
                    this.viewModel.on("searchGeometry", lang.hitch(this, this.searchGeometry));

                    var anonSearchChange = lang.hitch(this, this.handleSearchChange);

                    this.viewModel.searchText.subscribe(anonSearchChange);

                    this.viewModel.searchCities.subscribe(anonSearchChange);
                    this.viewModel.searchStates.subscribe(anonSearchChange);
                },
                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.LOADED, lang.hitch(this, this.handleQueryLayerControllersLoaded));
                },
                /**
                 * called when all of the query layer controllers have been loaded by the discovery application
                 * @param queryLayerControllers
                 */
                handleQueryLayerControllersLoaded: function (queryLayerControllers) {
                    this.queryLayerControllers = queryLayerControllers;
                },
                handleSearchChange: function (newValue) {
                    var searchString = this.viewModel.searchText();
                    if (searchString.length > 1) {
                        this.performSearch();
                    }
                    else {
                        this.clear();
                    }
                },
                handleManualClear: function () {
                    this.viewModel.searchText("");
                    this.clear();
                },
                performSearch: function () {
                    var searchString = this.viewModel.searchText();
                    if (searchString == null || searchString == "") {
                        return;
                    }
                    this.clear();

                    var searchCities = this.viewModel.searchCities();
                    var searchStates = this.viewModel.searchStates();
                    if (!searchCities && !searchStates) {
                        return;
                    }
                    var searchTypes = [];

                    if (searchCities) {
                        searchTypes.push("cities");
                    }
                    if (searchStates) {
                        searchTypes.push("states");

                    }


                    var queryUrl = "http://rrivera2.esri.com:3000/geometry/find/" + searchTypes.join("|") + "/" + searchString;
                    var cached = this.getCachedResult(queryUrl);
                    if (cached != null) {
                        this.setResults(cached);
                    }
                    else {

                        xhr(queryUrl, {
                            handleAs: "json"
                        }).then(lang.hitch(this,
                                function (queryUrl, results) {
                                    this.cacheResult(queryUrl, results);
                                    this.setResults(results);
                                }, queryUrl))
                    }
                },
                cacheResult: function (queryUrl, results) {
                    this.resultCache[queryUrl] = results;
                },
                getCachedResult: function (queryUrl) {
                    return this.resultCache[queryUrl];
                },
                clear: function () {
                    this.graphicsLayer.clear();
                    this.viewModel.results.removeAll();
                    this.viewModel.currentResultCount(0);
                },
                setResults: function (results) {
                    if (results == null || results.length == 0) {
                        return;
                    }
                    var xmin;
                    var ymin;
                    var xmax;
                    var ymax = 0;
                    var currentResult;
                    for (var i = 0; i < results.length; i++) {
                        currentResult = results[i];
                        var geom = new Polygon(currentResult.geometry);
                        var extent = geom.getExtent();
                        if (i == 0) {
                            xmin = extent.xmin;
                            ymin = extent.ymin;
                            xmax = extent.xmax;
                            ymax = extent.ymax;
                        }
                        else {
                            if (xmin > extent.xmin) {
                                xmin = extent.xmin;
                            }
                            if (ymin > extent.ymin) {
                                ymin = extent.ymin;
                            }
                            if (xmax < extent.xmax) {
                                xmax = extent.xmax;
                            }
                            if (ymax < extent.ymax) {
                                ymax = extent.ymax;
                            }
                        }
                        currentResult.geometry = geom;
                        this.viewModel.results.push(currentResult);
                        var graphic = new Graphic(geom, this.defaultSymbol);
                        this.graphicsLayer.add(graphic);
                    }
                    var extent = new Extent(xmin - 5, ymin - 5, xmax + 5, ymax + 5, new SpatialReference({wkid: 4326}));
                    this.map.setExtent(extent);
                    this.viewModel.currentResultCount(results.length);

                },
                zoomTo: function (geometry) {
                    this.map.setExtent(geometry.getExtent());

                },
                searchGeometry: function (geometry) {
                    //clear the previous result
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR);
                    var imageQueryParameters = new ImageQueryLayerControllerQueryParameters({
                        queryLayerControllers: this.queryLayerControllers,
                        returnGeometry: true
                    });
                    imageQueryParameters.geometry = geometry;
                    imageQueryParameters.errback = function () {
                        alert("err")
                    };
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.SEARCH.GEOMETRY, imageQueryParameters);
                }

            });

    });