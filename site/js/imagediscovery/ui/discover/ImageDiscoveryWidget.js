define([
        "dojo/_base/declare",
        "dojo/text!./template/ImageDiscoveryTemplate.html",
        // "xstyle/css!./theme/ImageDiscoveryTheme.css",
        "dojo/topic",
        "dojo/has",
        'dijit/layout/ContentPane',
        "dojo/_base/lang",
        "esriviewer/ui/base/UITemplatedWidget",
        "esriviewer/ui/draw/base/MapDrawSupport",
        "dojo/_base/Color",
        "../discover/upload/GeometryUploadWidget",
        "./SearchByBoundsWidget",
        "../query/ImageQueryWidget",
        "./model/ImageDiscoveryViewModel",
        "dijit/form/NumberTextBox",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/graphic",
        "esri/geometry/Geometry",
        "esri/geometry/Point",
        "esri/geometry/Polygon",
        "esri/geometry/Polyline",
        "esri/geometry/Extent",
        "../../base/ImageQueryLayerControllerQueryParameters",
        "./base/SearchByMetadata"
    ],
    //  function (declare, template, theme, topic, has, ContentPane, lang,   UITemplatedWidget, MapDrawSupport, Color, GeometryUploadWidget, SearchByBoundsWidget, ImageQueryWidget, ImageDiscoveryViewModel, NumberTextBox, SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, Graphic, Geometry, Point, Polygon, Extent, ImageQueryLayerControllerQueryParameters) {
    function (declare, template, topic, has, ContentPane, lang, UITemplatedWidget, MapDrawSupport, Color, GeometryUploadWidget, SearchByBoundsWidget, ImageQueryWidget, ImageDiscoveryViewModel, NumberTextBox, SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, Graphic, Geometry, Point, Polygon, Polyline, Extent, ImageQueryLayerControllerQueryParameters, SearchByMetadata) {
        return declare(
            [ContentPane, UITemplatedWidget, MapDrawSupport],
            {
                metadataSearchEnabled: false,
                createQueryFieldsDiscoveryContent: false,
                title: "Discover",
                templateString: template,
                constructor: function (params) {
                    lang.mixin(this, params || {});
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.searchByGeometryGeometryQueryErrorback = lang.hitch(this, this.handleSearchByGeometryGeometryQueryError);
                    this.performSearchCallback = lang.hitch(this, this.performSearch);
                    this.viewModel = new ImageDiscoveryViewModel();
                    this.viewModel.metadataSearchEnabled(this.metadataSearchEnabled);
                    this.viewModel.on("firstBoundsDisplay", lang.hitch(this, this.createBoundsView));
                    this.viewModel.on("viewChange", lang.hitch(this, this.handleViewChanged));
                    this.viewModel.discoverByFieldsExpanded.subscribe(lang.hitch(this, this.handleDiscoveryByFieldsToggle));
                    this.initSymbology();
                    if (this.createQueryFieldsDiscoveryContent) {
                        this.viewModel.selectedDiscoveryService.subscribe(lang.hitch(this, this.handleSearchServiceChanged));
                    }
                    ko.applyBindings(this.viewModel, this.domNode);
                    if (this.discoverGeometryUploadTaskConfiguration == null || !lang.isObject(this.discoverGeometryUploadTaskConfiguration)) {
                        this.viewModel.searchByGeometryButtonVisible(false);
                    }
                    else {
                        this.createUploadView();
                    }
                    if (this.createQueryFieldsDiscoveryContent) {
                        this.createQueryView();
                    }

                    this.metadataSearch = new SearchByMetadata();
                    this.metadataSearch.on("searchByGeometry", lang.hitch(this, this.searchByMetadataGeometry));
                    this.metadataSearch.placeAt(this.metadataSearchContainer);

                },
                /**
                 * toggle the view for searching by field value in the discovery widget
                 */

                handleDiscoveryByFieldsToggle: function (expanded) {
                    if (!expanded && this.imageQueryWidget) {
                        this.imageQueryWidget.closePopups();
                    }
                },
                initListeners: function () {
                    //listen for when the accordion has been hidden
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.TOOLS.ACCORDION.HIDE_COMPLETE, lang.hitch(this, this.handleAccordionHidden));
                    //listen for when all query layer controllers have been loaded
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.LOADED, lang.hitch(this, this.handleQueryLayerControllersLoaded));
                    this.on("annotationCreated", lang.hitch(this, this.handleAnnotationAddedFromUser));
                    this.on("show", lang.hitch(this, this.handleOnShow));
                    //listen for clear results
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.handleResultsCleared));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.COMPLETE, lang.hitch(this, this.handleSearchComplete));
                },
                handleSearchComplete: function () {
                    //todo: this.viewModel.searchInProgress(false);
                },
                /**
                 * called when the search service has changed in the service select box
                 * @param queryController
                 */
                handleSearchServiceChanged: function (queryController) {
                    //when search service changed the unique values need to be reloaded
                    if (this.imageQueryWidget) {
                        if (queryController == null) {
                            this.hideUniqueValuesContent();
                        }
                        else {
                            this.viewModel.discoverByFieldsHeaderVisible(true);
                            this.imageQueryWidget.setCurrentQueryLayerController(queryController)
                        }
                    }
                },
                /**
                 * called when all of the query layer controllers have been loaded by the discovery application
                 * @param queryLayerControllers
                 */
                handleQueryLayerControllersLoaded: function (queryLayerControllers) {
                    var currentQueryLayerController;
                    var currentQueryLayer;
                    this.queryLayerControllers = queryLayerControllers;
                    var imageDiscoveryQueryFieldsUniqueValuesConfig = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageDiscoveryQueryFieldsUniqueValues", function (imageDiscoveryQueryFieldsUniqueValuesConf) {
                        imageDiscoveryQueryFieldsUniqueValuesConfig = imageDiscoveryQueryFieldsUniqueValuesConf;
                    });
                    if (imageDiscoveryQueryFieldsUniqueValuesConfig != null && lang.isObject(imageDiscoveryQueryFieldsUniqueValuesConfig)) {
                        this.imageQueryWidget.populateDefaultValues(queryLayerControllers, imageDiscoveryQueryFieldsUniqueValuesConfig);
                    }
                    if (queryLayerControllers.length == 1) {
                        this.viewModel.selectSearchServiceVisible(false);
                        if (this.createQueryFieldsDiscoveryContent) {
                            this.viewModel.discoverByFieldsHeaderVisible(true);
                            this.handleSearchServiceChanged(queryLayerControllers[0]);
                        }
                    }
                    else {
                        this.viewModel.selectSearchServiceVisible(true);
                        for (var i = 0; i < queryLayerControllers.length; i++) {
                            currentQueryLayerController = queryLayerControllers[i];
                            currentQueryLayer = (currentQueryLayerController && currentQueryLayerController.layer) ? currentQueryLayerController.layer : null;
                            if (currentQueryLayerController && currentQueryLayer) {
                                this.viewModel.discoveryServicesList.push({label: currentQueryLayer.searchServiceLabel, value: currentQueryLayerController});
                            }
                        }
                    }
                },
                /**
                 * hides the unique values widget for the discovery widget
                 */
                hideUniqueValuesContent: function () {
                    //hide unique values view
                    this.viewModel.discoverByFieldsExpanded(false);
                    this.viewModel.discoverByFieldsHeaderVisible(false);
                },
                createQueryView: function () {
                    //create the view which shows unique values for the active service
                    this.imageQueryWidget = new ImageQueryWidget();
                    this.imageQueryWidget.on("noUniqueValuesReturned", lang.hitch(this, this.hideUniqueValuesContent));
                    this.imageQueryWidget.placeAt(this.imageDiscoveryByQueryContainer);
                },
                loadViewerConfigurationData: function () {
                    //load the configuration
                    var discoveryGeometryUploadConfiguration = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "discoverGeometryUploadTask", function (discoveryGeometryUploadConf) {
                        discoveryGeometryUploadConfiguration = discoveryGeometryUploadConf;
                    });
                    if (discoveryGeometryUploadConfiguration != null && lang.isObject(discoveryGeometryUploadConfiguration)) {
                        this.discoverGeometryUploadTaskConfiguration = discoveryGeometryUploadConfiguration;
                    }
                    var metadataSearchConfig = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageQueryMetadataConfiguration", function (metadataSearchConf) {
                        metadataSearchConfig = metadataSearchConf;
                    });
                    this.metadataSearchEnabled = (metadataSearchConfig && metadataSearchConfig.enabled);


                    var discoveryQueryFields = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageDiscoveryQueryFields", function (discoveryQueryFieldsConf) {
                        discoveryQueryFields = discoveryQueryFieldsConf;
                    });
                    if (discoveryQueryFields != null && lang.isArray(discoveryQueryFields) && discoveryQueryFields.length > 0) {
                        this.createQueryFieldsDiscoveryContent = !(has("ie") == 7);
                    }


                },
                handleSearchByGeometryGeometryQueryError: function (msg) {
                    this.clearDraw();
                },
                /**
                 * initializes symbology for the discovery widget
                 */
                initSymbology: function () {
                    //init the discovery widget symbology
                    this.polygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([0, 0, 255]), 1), new Color([0, 0, 255, 0]));


                    this.pointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_X, 1,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color("blue")));
                    this.polylineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([0, 0, 255]), 1);

                    this.envelopeSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([0, 0, 255]), 1),
                        new Color([0, 0, 0, 0]));
                },
                /**
                 * called when the parent accordion widget has been hidden that contains the discovery widget
                 */
                handleAccordionHidden: function () {
                    if (this.imageQueryWidget) {
                        this.imageQueryWidget.closePopups();
                    }
                },
                /**
                 * called when the discovery widget has been displayed
                 */
                handleOnShow: function () {
                    //fire event telling other widgets the discovery widget has come into view
                    topic.publish(IMAGERY_GLOBALS.EVENTS.DISCOVERY.ON_SHOW);
                },
                handleResultsCleared: function () {
                    //when results are cleared remove and geometries left over from the initial search
                },
                /**
                 * activates the search by map extent in the discovery widget
                 */
                activateSearchByExtent: function () {
                    //searches by map extent
                    var mapExtent = null;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.GET_EXTENT, function (ext) {
                        mapExtent = ext;
                    });
                    if (mapExtent == null) {
                        return;
                    }
                    this.performSearch(mapExtent, false);
                },
                searchByMetadataGeometry: function (geometry) {
                    this.performSearch(geometry, false);
                },
                /**
                 * performs a search based on the current selected discovery widget
                 * @param searchObject
                 * @param zoomToArea
                 */
                performSearch: function (searchObject, zoomToArea) {
                    //figure out what type of search is being performed and perform the search
                    if (searchObject == null) {
                        return;
                    }
                    //searchObject can either be a graphic,geometry or array of geometries
                    var graphic;
                    var whereClause = "";
                    if (this.imageQueryWidget != null && this.viewModel.discoverByFieldsExpanded()) {
                        whereClause = this.imageQueryWidget.getQuery();
                    }

                    //clear the previous result
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR);
                    //get the services to query
                    var queryLayerControllers;
                    var selectedDiscoveryService = this.viewModel.selectedDiscoveryService();
                    if (selectedDiscoveryService) {
                        queryLayerControllers = [selectedDiscoveryService];
                    }
                    else {
                        queryLayerControllers = this.queryLayerControllers;
                    }
                    var imageQueryParameters = new ImageQueryLayerControllerQueryParameters({
                        queryLayerControllers: queryLayerControllers,
                        whereClause: whereClause,
                        returnGeometry: true
                    });
                    var searchGraphic;
                    if (lang.isArray(searchObject) && searchObject.length > 0) {
                        //just take the first entry, should be a multipart polygon
                        searchObject = searchObject[0];
                    }
                    //figure out if the search object is already a graphic or if it is a geometry that needs to be turned into a graphic
                    if (searchObject instanceof Graphic) {
                        searchGraphic = searchObject;
                    }
                    else if (searchObject instanceof Geometry) {
                        graphic = null;
                        if (searchObject instanceof Point) {
                            graphic = new Graphic(searchObject, this.pointSymbol);
                        }
                        else if (searchObject instanceof Polygon) {
                            graphic = new Graphic(searchObject, this.polygonSymbol);
                        }
                        else if (searchObject instanceof Polyline) {
                            graphic = new Graphic(searchObject, this.polylineSymbol);
                        }
                        else if (searchObject instanceof Extent) {
                            graphic = new Graphic(searchObject, this.polygonSymbol);
                        }
                        if (graphic) {
                            searchGraphic = graphic;
                        }
                    }
                    //todo:   this.viewModel.searchInProgress(true);
                    imageQueryParameters.geometry = searchGraphic.geometry;
                    imageQueryParameters.errback = this.searchByGeometryGeometryQueryErrorback;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.SEARCH.GEOMETRY, imageQueryParameters);
                },
                /**
                 * called when the current discovery search type changes
                 * @param oldView
                 * @param newView
                 */
                handleViewChanged: function (oldView, newView) {
                    //figure out what view we are in and publish draw events accordingly
                    if (oldView == newView && newView != this.viewModel.views.extent) {
                        return;
                    }
                    if (newView == this.viewModel.views.point) {
                        this.setDraw(VIEWER_GLOBALS.EVENTS.MAP.TOOLS.DRAW_POINT);
                    }
                    else if (newView == this.viewModel.views.rectangle) {
                        this.setDraw(VIEWER_GLOBALS.EVENTS.MAP.TOOLS.DRAW_RECTANGLE);

                    }
                    else if (newView == this.viewModel.views.extent) {
                        this.activateSearchByExtent();
                        if (oldView == this.viewModel.views.rectangle || oldView == this.viewModel.views.point) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.DRAW.USER.DRAW_CANCEL);
                        }
                    }
                    else {
                        if (oldView == this.viewModel.views.rectangle || oldView == this.viewModel.views.point) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.DRAW.USER.DRAW_CANCEL);
                        }
                    }
                },
                /**
                 * performs a search on a graphic added to the map from the discovery widget
                 * @param annoObj
                 */
                handleAnnotationAddedFromUser: function (annoObj) {
                    //{ id:uuid, type:type, graphic:graphic }
                    var isPointBuffer = false;
                    if (this.viewModel.currentView() == this.viewModel.views.point) {
                        //perform a buffer if it exists. the buffer will be the displayed graphic
                        var bufferValue = this.pointDrawBufferValue.get("value");
                        if (!isNaN(bufferValue) && bufferValue > 0) {
                            var bufferUnits = this.viewModel.selectedPointUnits();
                            var distanceAndUnits = {distance: bufferValue, units: bufferUnits};
                            var callback = lang.hitch(this, this.handlePointBufferResponse, annoObj);
                            var errback = lang.hitch(this, this.handlePointBufferError, annoObj);
                            topic.publish(VIEWER_GLOBALS.EVENTS.GEOMETRY_SERVICE.BUFFER_POINT, annoObj.graphic.geometry, distanceAndUnits, callback, errback);
                            isPointBuffer = true;
                        }
                    }
                    this.viewModel.currentView(this.viewModel.views.none);
                    if (!isPointBuffer) {
                        //perform the search right away since we don't have to send another server request for buffering a point
                        this.performSearch(annoObj.graphic);
                    }
                },
                /**
                 * handles a point buffer search error
                 * @param annoObj
                 */
                handlePointBufferError: function (annoObj) {
                    this.performSearch(annoObj.graphic);
                },
                /**
                 * handles a point buffer response
                 * @param annoObj
                 * @param bufferResponse
                 */
                handlePointBufferResponse: function (annoObj, bufferResponse) {
                    //clear the X graphic for the point
                    if (bufferResponse != null && lang.isArray(bufferResponse) && bufferResponse.length > 0) {
                        this.performSearch(bufferResponse[0]);
                    }
                    else {
                        this.performSearch(annoObj.graphic);
                    }
                },
                /**
                 * creates the kml/shp/kmz upload widget and places is in the view
                 */
                createUploadView: function () {
                    //set the max upload geometries allowed
                    if (this.geometryUploadWidget == null) {
                        this.geometryUploadWidget = new GeometryUploadWidget();
                        this.geometryUploadWidget.placeAt(this.geometryUploadWidgetContainer);
                        this.geometryUploadWidget.on("performSearch", this.performSearchCallback);
                    }
                },
                /**
                 * creates the search by bounds widget and places it in the view
                 */
                createBoundsView: function () {
                    if (this.searchByBoundsWidget == null) {
                        this.searchByBoundsWidget = new SearchByBoundsWidget();
                        this.searchByBoundsWidget.placeAt(this.imageDiscoverySearchByBoundsContainer);
                        this.searchByBoundsWidget.on("boundsGeometryCreated", this.performSearchCallback);
                    }
                },
                /**
                 * clears the graphics added to the map from the discovery widgets
                 */
                clearDraw: function () {
                    this.inherited(arguments);
                    //get zoom back for shift key
                    topic.publish(VIEWER_GLOBALS.EVENTS.DRAW.USER.DRAW_CANCEL);
                }
            });
    });