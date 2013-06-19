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
    "./ImageryWebMapTemplateConfigurationUtil"
],
    function (declare, has, domStyle, topic, on, window, con, lang, domConstruct, domClass, ActionsToolbarWidget, ViewerManager, ImageQueryResultsWidget, ImageDiscoveryWidget, ImageQueryController, ImageQueryLayerController, ImageInfoWindow, ArcGISImageServiceLayer, ImageryWebMapTemplateConfigurationUtil) {
        return declare(
            [ViewerManager],
            {
                configUrl: "config/imagery/imageryConfig.json",
                imageQueryConfigUrl: "config/imagery/imageQueryConfiguration.json",
                forceHideCoreTimeSlider: true,
                forceHideAccordionTab: true,
                useProxyForImageryQueryConfig: false,
                allowAccordionMove: true,
                viewerPositioningConfigUrl: "config/imagery/imageryViewerPositioning.json",
                constructor: function () {
                    this.on(this.FINALIZE_UI_LOAD_COMPLETE, lang.hitch(this.handleFinalizeUILoadComplete));
                    this.catalogLayers = [];
                    this.catalogQueryControllers = [];
                    this.serviceLoadingContainer = domConstruct.create("div", {className: "defaultBackground fivePixelBorderRadius defaultBoxShadow loadingImageServiceMessageContainer"});
                    this.serviceLoadingMessage = domConstruct.create("span", {innerHTML: "Loading Catalog Service...", className: "loadingImageServiceText"});
                    this.serviceLoadingThrobber = domConstruct.create("div", {className: "loadingImageServiceThrobber"});
                    domConstruct.place(this.serviceLoadingThrobber, this.serviceLoadingContainer);
                    domConstruct.place(this.serviceLoadingMessage, this.serviceLoadingContainer);
                    domConstruct.place(this.serviceLoadingContainer, window.body());
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
                _initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.ADD, lang.hitch(this, this.handleImageQueryResultsResponse));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_QUERY_SERVICES_INFO, lang.hitch(this, this.handleGetQueryServicesInfo));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.GET_CATALOG_LAYERS, lang.hitch(this, this.handleGetCatalogLayers));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET, lang.hitch(this, this.handleGetImageryConfiguration));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, lang.hitch(this, this.handleGetImageryConfigurationKey));
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
                    this.createImageInfoWidget();
                    this.createImageDiscoveryWidget();
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
                handleImageServiceLoaded: function (layer) {
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
                    topic.publish(VIEWER_GLOBALS.EVENTS.FOOTER.EXPAND);
                    //create the query results widget if it doesn't exist
                    if (this.imageryQueryResultsWidget == null) {
                        this.createImageQueryResultsWidget();
                    }
                    //set the results
                    this.imageryQueryResultsWidget.addQueryResults(response, queryLayerController);
                },
                handleBaseConfigurationsLoaded: function () {
                    //load query config
                    if (this.queryConfig == null) {
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
                    this.queryConfig = queryConfig;
                    this.startupViewer();
                },
                handleQueryConfigLoadFailed: function () {
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
                    this.mainToolbar.locateToolbarContainer.parentNode.removeChild(this.mainToolbar.locateToolbarContainer);
                    domConstruct.place(this.mainToolbar.locateToolbarContainer, this.imageDiscoveryWidget.imageDiscoverLocatorInputContainer);
                    domStyle.set(this.mainToolbar.locateToolbarContainer, "display", "block");
                    //IE9 renders the buttons differently when the locator is in the discovery tab pane
                    if (has("ie") === 9) {
                        domStyle.set(this.mainToolbar.locateButton, "height", "18px");
                        domStyle.set(this.mainToolbar.configureLocateButton, "height", "18px");
                    }
                    //remove the on map class from the locator
                    domClass.remove(this.mainToolbar.locateToolbarContainer, "locateToolbarContainerOnMap");
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
                }
            }
        )
    });
