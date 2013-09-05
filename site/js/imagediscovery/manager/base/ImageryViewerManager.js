define([
    "dojo/_base/declare",
    "dojo/has",
    "dojo/dom-style",
    "dojo/topic",
    "dojo/on",
    "dojo/_base/window",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "esriviewer/ui/toolbar/ActionsToolbarWidget",
    "esriviewer/manager/base/ViewerManager",
    "../../ui/results/ImageQueryResultsWidget",
    "../../ui/discover/ImageDiscoveryWidget",
    "../../ImageQueryController",
    "../../ImageQueryLayerController",
    "../../ui/info/ImageInfoWindow",
    "esri/layers/ArcGISImageServiceLayer",
    "./ImageryWebMapTemplateConfigurationUtil",
    "dijit/form/ToggleButton"
],
    function (declare, has, domStyle, topic, on, window, con, lang, domConstruct, domClass, ActionsToolbarWidget, ViewerManager, ImageQueryResultsWidget, ImageDiscoveryWidget, ImageQueryController, ImageQueryLayerController, ImageInfoWindow, ArcGISImageServiceLayer, ImageryWebMapTemplateConfigurationUtil, ToggleButton) {
        return declare(
            [ViewerManager],
            {
                //base configuraiton url
                configUrl: "config/imagery/imageryConfig.json",
                //imagery configuration url
                imageQueryConfigUrl: "config/imagery/imageQueryConfiguration.json",
                //we want to use the imagery time slider instead of the base viewer time slider
                forceHideCoreTimeSlider: true,
                //we want to control the accordion visibility, not the base viewer
                forceHideAccordionTab: true,
                useProxyForImageryQueryConfig: false,
                //allow the discovery accordion to move
                allowAccordionMove: true,
                //viewer positioning URL
                viewerPositioningConfigUrl: "config/imagery/imageryViewerPositioning.json",
                constructor: function () {
                    //listen for UI load complete so we can tweak some UI for this viewer
                    this.on(this.FINALIZE_UI_LOAD_COMPLETE, lang.hitch(this.handleFinalizeUILoadComplete));
                    //cached catalog layers
                    this.catalogLayers = [];
                    //query layer controllers array
                    this.catalogQueryControllers = [];
                },
                processConfig: function () {
                    if (this.appId != null) {
                        var configWebMapTemplateConfigUtil = new ImageryWebMapTemplateConfigurationUtil();
                        configWebMapTemplateConfigUtil.loadConfiguration(this.appId).then(lang.hitch(this, this._handleWebMapTemplateConfigurationLoaded));
                    }
                    else {
                        if (this.useProxyForConfig) {
                            this.loadProxiedConfig();
                        }
                        else {
                            this.loadConfig();
                        }
                    }
                },
                displayCatalogLoading: function () {
                    //loading services throbber when the page loads
                    this.serviceLoadingContainer = domConstruct.create("div", {className: "defaultBackground fivePixelBorderRadius defaultBoxShadow loadingImageServiceMessageContainer"});
                    this.serviceLoadingMessage = domConstruct.create("span", {innerHTML: "Loading Catalog Service...", className: "loadingImageServiceText"});
                    this.serviceLoadingThrobber = domConstruct.create("div", {className: "loadingImageServiceThrobber"});
                    domConstruct.place(this.serviceLoadingThrobber, this.serviceLoadingContainer);
                    domConstruct.place(this.serviceLoadingMessage, this.serviceLoadingContainer);
                    //add to the dom
                    domConstruct.place(this.serviceLoadingContainer, window.body());
                },
                _initListeners: function () {
                    this.inherited(arguments);
                    //add search result to the application
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.ADD, lang.hitch(this, this.handleImageQueryResultsResponse));
                    //get service infos for catalog services
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_QUERY_SERVICES_INFO, lang.hitch(this, this.handleGetQueryServicesInfo));
                    //get all of the search catalog layers
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.GET_CATALOG_LAYERS, lang.hitch(this, this.handleGetCatalogLayers));
                    //get configuration object
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET, lang.hitch(this, this.handleGetImageryConfiguration));
                    //get a configuration entry by key
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, lang.hitch(this, this.handleGetImageryConfigurationKey));
                    //get the layer controllers. layer controllers contain layer reference and metadata associated with layer
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, lang.hitch(this, this.handleGetQueryLayerControllers));
                },
                handleGetQueryLayerControllers: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.catalogQueryControllers);
                    }
                },
                handleGetCatalogLayers: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.catalogLayers);
                    }
                },
                _handleWebMapTemplateConfigurationLoaded: function (config) {
                    this.handleConfigLoaded(config.viewerConfig);
                    this.queryConfig = config.imageryConfig;
                },
                handleGetImageryConfigurationKey: function (key, callback) {
                    if (key != null && key != "" && callback && lang.isFunction(callback)) {
                        callback(this.queryConfig[key]);
                    }
                },
                handleGetImageryConfiguration: function (callback) {
                    if (callback && lang.isFunction(callback)) {
                        callback(this.queryConfig);
                    }
                },
                handleGetQueryServicesInfo: function (callback) {
                    if (callback && lang.isFunction(callback)) {
                        if (this.queryConfig && this.queryConfig.imageQueryLayers && lang.isArray(this.queryConfig.imageQueryLayers)) {
                            callback(this.queryConfig.imageQueryLayers);
                        }
                        else {
                            callback([]);
                        }
                    }
                },
                cancelMensuration: function () {
                    if (this.imageManipulationWidget && this.imageManipulationWidget.mensurationWidget) {
                        this.imageManipulationWidget.mensurationWidget.cancelMensuration();
                    }
                },
                loadControllers: function () {
                    this.createImageManipulationWidget();
                    //image info widget displays a results thumbnail and attributes
                    this.createImageInfoWidget();
                    //image discovery widget allows the user to locate and discover imagery
                    this.createImageDiscoveryWidget();
                    //query controller handles all requests to query catalog services.
                    this.createImageQueryController();
                    this.inherited(arguments);
                },
                createImageDiscoveryWidget: function () {
                    this.imageDiscoveryWidget = new ImageDiscoveryWidget();
                },
                createImageQueryController: function () {
                    this.imageQueryController = new ImageQueryController();
                },
                createImageInfoWidget: function () {
                    this.imageInfoWidget = new ImageInfoWindow();
                },
                createImageManipulationWidget: function () {
                },
                handleMapLoaded: function (map) {
                    this.inherited(arguments);
                    //load the image service urls we will operate on
                    if (this.queryConfig && this.queryConfig.imageQueryLayers && lang.isArray(this.queryConfig.imageQueryLayers)) {
                        var currentImageServiceObj;
                        this.loadedQueryLayersCount = 0;
                        for (var i = 0; i < this.queryConfig.imageQueryLayers.length; i++) {
                            currentImageServiceObj = this.queryConfig.imageQueryLayers[i];
                            if (currentImageServiceObj.url) {
                                //todo: need to make this an extended ImageService layer. can't do this until ArcGISImageServiceLayer supports AMD
                                var imageServiceQueryLayer = new esri.layers.ArcGISImageServiceLayer(currentImageServiceObj.url);
                                //see if there is a query to append to all the dynamic queries
                                if (currentImageServiceObj.queryWhereClauseAppend && currentImageServiceObj.queryWhereClauseAppend.length > 0) {
                                    imageServiceQueryLayer.queryWhereClauseAppend = currentImageServiceObj.queryWhereClauseAppend;
                                }
                                imageServiceQueryLayer.searchServiceLabel = currentImageServiceObj.label ? currentImageServiceObj.label : "Search Service " + i;
                                topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD, imageServiceQueryLayer, {canRemove: false, isOperationalLayer: false}, lang.hitch(this, this.handleImageServiceLoaded), lang.hitch(this, this.handleImageServiceLoadError));
                            }
                        }
                    }
                    map.resize();
                },
                handleImageServiceLoadError: function (layer) {
                    VIEWER_UTILS.log("There was an error querying a catalog service.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    if (++this.loadedQueryLayersCount == this.queryConfig.imageQueryLayers.length) {
                        this.finalizeQueryLayerLoad();
                    }
                },
                handleImageServiceLoaded: function (evt) {
                    if (evt == null || evt.layer == null) {
                        return;
                    }
                    var layer = evt.layer;
                    //load the key properties
                    this.catalogQueryControllers.push(new ImageQueryLayerController({layer: layer, label: layer.searchServiceLabel}));
                    VIEWER_UTILS.log("Loaded Catalog Service", VIEWER_GLOBALS.LOG_TYPE.INFO);
                    IMAGERY_UTILS.loadKeyProperties(layer, lang.hitch(this, this.handleQueryImageServiceKeyPropertiesLoaded));
                },
                handleQueryImageServiceKeyPropertiesLoaded: function (layer) {
                    layer.hide();
                    this.catalogLayers.push(layer);
                    if (++this.loadedQueryLayersCount == this.queryConfig.imageQueryLayers.length) {
                        this.finalizeQueryLayerLoad();
                    }
                },
                finalizeQueryLayerLoad: function () {
                    domConstruct.destroy(this.serviceLoadingContainer);
                    VIEWER_UTILS.log("Publishing catalog layer to widgets", VIEWER_GLOBALS.LOG_TYPE.INFO);
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.LOADED, this.catalogQueryControllers);
                    this.viewerAccordion.show();
                },
                handleImageQueryResultsResponse: function (response, queryLayerController) {
                    //expand the footer to show the results grid
                    topic.publish(VIEWER_GLOBALS.EVENTS.FOOTER.EXPAND);
                    //create the query results widget if it doesn't exist
                    if (this.imageryQueryResultsWidget == null) {
                        this.createImageQueryResultsWidget();
                    }
                    //set the results on the grid
                    this.imageryQueryResultsWidget.addQueryResults(response, queryLayerController);
                },
                handleBaseConfigurationsLoaded: function () {
                    //load query config
                    if (this.queryConfig == null) {
                        //base configuration has been loaded so now load the imagery configuration json
                        if (this.useProxyForImageryQueryConfig) {
                            this.loadProxiedJson(this.imageQueryConfigUrl, lang.hitch(this, this.handleQueryWidgetConfigurationLoaded), lang.hitch(this, this.handleQueryConfigLoadFailed));
                        }
                        else {
                            this.loadJson(this.imageQueryConfigUrl, lang.hitch(this, this.handleQueryWidgetConfigurationLoaded), lang.hitch(this, this.handleQueryConfigLoadFailed));
                        }
                    }
                    else {
                        this.handleQueryWidgetConfigurationLoaded(this.queryConfig);
                    }
                },
                handleQueryWidgetConfigurationLoaded: function (queryConfig) {
                    //set the query config on the class instance
                    this.queryConfig = queryConfig;
                    //finally, start up the viewer
                    if (this.queryConfig.userAddCatalogMode === true) {
                        this.initUserAddCatalogMode();
                    }
                    else {
                        this.startupViewer();
                    }
                },
                startupViewer: function(){
                    this.displayCatalogLoading();
                    this.inherited(arguments);
                },
                initUserAddCatalogMode: function () {
                    require(["imagediscovery/ui/catalog/AddCatalogModalWindow"], lang.hitch(this, function (AddCatalogModalWindow) {
                        var addCatalodModalWindow = new AddCatalogModalWindow();
                        addCatalodModalWindow.on("catalogSet", lang.hitch(this, function (catalogParams) {

                            lang.mixin(this.queryConfig, catalogParams);
                            addCatalodModalWindow.destroy();
                            this.startupViewer();
                        }));
                    }));

                },
                handleQueryConfigLoadFailed: function () {
                    //show error since query json configuration load failed
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not load query configuration. Application is not functional", 100000);
                },
                createImageQueryResultsWidget: function () {
                    //need to set the catalog layer on this class because it wasn't create when the catalog layer was found
                    if (this.imageryQueryResultsWidget == null) {
                        this.imageryQueryResultsWidget = new ImageQueryResultsWidget();
                        this.footerTogglerWidget.setContent(this.imageryQueryResultsWidget.domNode);
                        this.imageryQueryResultsWidget.startup();
                    }
                },
                handleFirstFooterShow: function () {
                    //on first footer show create the query results widget so we don't have the overhead on page load
                    if (this.imageryQueryResultsWidget == null) {
                        this.createImageQueryResultsWidget();
                    }
                },
                handleShowDiscovery: function () {
                    //toggles the discovery widget
                    if (!this.viewerAccordion.visible) {
                        this.viewerAccordion.show();
                        this.viewerAccordion.selectChild(this.imageDiscoveryWidget);
                    }
                    else {
                        if (this.viewerAccordion.selectedChild == this.imageDiscoveryWidget) {
                            this.viewerAccordion.hide();
                        }
                        else {
                            this.viewerAccordion.selectChild(this.imageDiscoveryWidget);
                        }
                    }
                },
                _createViewerAccordion: function () {
                    this.inherited(arguments);
                    this.viewerAccordion.hide();
                },
                finalizeUILoad: function () {
                    this.inherited(arguments);
                    this.loadImageryUIAddons();
                    this.placeImageDiscoveryWidget();
                    domStyle.set(this.mainToolbar.locateToolbarContainer, "display", "block");
                },
                loadImageryUIAddons: function () {
                    this._createSwipeWidget();
                },
                _createSwipeWidget: function () {
                    if (this.viewerConfig.swipeWidget != null && lang.isObject(this.viewerConfig.swipeWidget) && this.viewerConfig.swipeWidget.create) {
                        this.createSwipeWidget();
                    }
                },
                createSwipeWidget: function () {
                },
                placeImageDiscoveryWidget: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.PLACEMENT.GLOBAL.PLACE.DISCOVERY_WIDGET, this.imageDiscoveryWidget, this.imageDiscoveryWidget.title);
                },
                handleFinalizeUILoadComplete: function () {
                    //move the throbber and the messaging widget if the header is displayed
                    if (this.viewerConfig.header != null && lang.isObject(this.viewerConfig.header) &&
                        this.viewerConfig.header.display && !this.viewerConfig.header.small) {
                        if (this.loadingThrobber) {
                            domStyle.set(this.loadingThrobber.domNode, "left", "35%");
                        }
                        if (this.messagingWidget) {
                            domStyle.set(this.messagingWidget.domNode, "left", "45%");
                        }
                    }
                },
                 //_createViewerMainToolbar: extend the function to add the footprints toggle button
                _createViewerMainToolbar: function () {
                    this.inherited(arguments);
                    var toggleFootprintsButton = new ToggleButton({
                        showLabel: true,
                        checked: true,
                        label: "Footprints",
                        iconClass: "dijitCheckBoxIcon"
                    });

                    domClass.add(toggleFootprintsButton.domNode, "defaultTextColor");

                    domStyle.set(toggleFootprintsButton.domNode.firstChild, "background", "none");
                    domStyle.set(toggleFootprintsButton.domNode.firstChild, "border", "none");

                    on(toggleFootprintsButton, "change", function (checked) {
                        if (checked) {
                            topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.SET_FOOTPRINTS_LAYER_OPAQUE);
                        }
                        else {
                            topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.SET_FOOTPRINTS_LAYER_TRANSPARENT);
                        }
                    });
                    domConstruct.place(toggleFootprintsButton.domNode, this.mainToolbar.addOnContentContainer);

                    domStyle.set(this.mainToolbar.addOnContentContainer, "float", "right");
                }
            }
        )
    });