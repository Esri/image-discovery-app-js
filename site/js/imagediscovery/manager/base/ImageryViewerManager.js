define([
        "dojo/_base/declare",
        "dojo/dom-style",
        "dojo/topic",
        "dojo/on",
        "dojo/_base/window",
        "dojo/_base/connect",
        "dojo/_base/lang",
        "dojo/dom-construct",
        "dojo/dom-class",
        "esriviewer/manager/base/ViewerManager",
        "../../ui/results/ImageQueryResultsWidget",
        "../../ui/discover/ImageDiscoveryWidget",
        "../../ImageQueryController",
        "../../ImageQueryLayerController",
        "esri/layers/ArcGISImageServiceLayer",
        "./ImageryWebMapTemplateConfigurationUtil",
        "dijit/form/ToggleButton",
        "../../layers/thumbnail/ShadedThumbnailManager",
        "../../ui/results/popup/ResultPopup",
        "esriviewer/ui/toolbar/base/button/Button",
        "../../ui/results/popup/MapIdentifyPopupTooltip",
        "esri/geometry/screenUtils"

    ],
    function (declare, domStyle, topic, on, window, con, lang, domConstruct, domClass, ViewerManager, ImageQueryResultsWidget, ImageDiscoveryWidget, ImageQueryController, ImageQueryLayerController, ArcGISImageServiceLayer, ImageryWebMapTemplateConfigurationUtil, ToggleButton, ShadedThumbnailManager, ResultPopup, Button, MapIdentifyPopupTooltip, screenUtils) {
        return declare(
            [ViewerManager],
            {
                applicationDrawInProgress: false,
                identifyEnabledZoomLevel: 1,
                //base configuration url
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
                /**
                 *  checks to see if the viewer should load internal config file or web application by appid from portal
                 *
                 */
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
                /**
                 *  shows "Loading catalog service" in the middle of the viewer while the catalog services are initialized
                 *
                 */
                displayCatalogLoading: function () {
                    //loading services throbber when the page loads
                    this.serviceLoadingContainer = domConstruct.create("div", {className: "defaultBackground fivePixelBorderRadius defaultBoxShadow loadingImageServiceMessageContainer"});
                    this.serviceLoadingMessage = domConstruct.create("span", {
                        innerHTML: "Loading Catalog Service...",
                        className: "loadingImageServiceText"
                    });
                    this.serviceLoadingThrobber = domConstruct.create("div", {className: "loadingImageServiceThrobber loadingSpinnerThrobber"});
                    domConstruct.place(this.serviceLoadingThrobber, this.serviceLoadingContainer);
                    domConstruct.place(this.serviceLoadingMessage, this.serviceLoadingContainer);
                    //add to the dom
                    domConstruct.place(this.serviceLoadingContainer, window.body());
                },
                initListeners: function () {
                    this.inherited(arguments);

                    //listen for query complete
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.COMPLETE, lang.hitch(this, this.handleImageQueryResultsResponse));

                    //add search result to the application
                    //todo  topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.ADD, lang.hitch(this, this.handleImageQueryResultsResponse));
                    //get all of the search catalog layers
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.GET_CATALOG_LAYERS, lang.hitch(this, this.handleGetCatalogLayers));
                    //get configuration object
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET, lang.hitch(this, this.handleGetImageryConfiguration));
                    //get a configuration entry by key
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, lang.hitch(this, this.handleGetImageryConfigurationKey));
                    //get the layer controllers. layer controllers contain layer reference and metadata associated with layer
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, lang.hitch(this, this.handleGetQueryLayerControllers));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_DISPLAY_FIELDS_LOOKUP, lang.hitch(this, this.handleGetDisplayFieldsLookup));


                    //listen for drawing. if there is drawing active we don't want the identify on map click for search results
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.DRAW.DRAW_STARTED, lang.hitch(this, this.handleApplicationDrawStart));
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.DRAW.DRAW_COMPLETE, lang.hitch(this, this.handleApplicationDrawEnd));
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.DRAW.DRAW_CANCELLED, lang.hitch(this, this.handleApplicationDrawEnd));

                },
                handleApplicationDrawStart: function () {
                    this.applicationDrawInProgress = true;
                },
                handleApplicationDrawEnd: function () {
                    this.applicationDrawInProgress = false;
                },

                handleGetDisplayFieldsLookup: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.resultFieldNameToLabelLookup);
                    }
                },
                /**
                 *  listener function for IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET
                 *  @param callback function to pass catalog layer controllers
                 *
                 */
                handleGetQueryLayerControllers: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.catalogQueryControllers);
                    }
                },
                /**
                 *  listener function for IMAGERY_GLOBALS.EVENTS.LAYER.GET_CATALOG_LAYERS
                 *  @param callback function to pass catalog layer controllers
                 *
                 */
                handleGetCatalogLayers: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.catalogLayers);
                    }
                },
                /**
                 *  @private
                 *  @description called when web map template configuration has been loaded from the URLs appid param
                 *
                 */
                _handleWebMapTemplateConfigurationLoaded: function (config) {
                    this.handleConfigLoaded(config.viewerConfig);
                    this.queryConfig = config.imageryConfig;
                },
                /**
                 *  listener function for IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY
                 *  @param key configuration key to return
                 *  @param callback function to return configuration object to
                 */
                handleGetImageryConfigurationKey: function (key, callback) {
                    if (key != null && key != "" && callback && lang.isFunction(callback)) {
                        callback(this.queryConfig[key]);
                    }
                },
                /**
                 *  listener function for IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET. returns the imagery configuration to the callback
                 *  @param callback function to return configuration  to
                 */
                handleGetImageryConfiguration: function (callback) {
                    if (callback && lang.isFunction(callback)) {
                        callback(this.queryConfig);
                    }
                },
                /**
                 *  cancels mensuration on the mensuration widget
                 */
                cancelMensuration: function () {
                    if (this.imageManipulationWidget && this.imageManipulationWidget.mensurationWidget) {
                        this.imageManipulationWidget.mensurationWidget.cancelMensuration();
                    }
                },
                /**
                 *  initializes controllers used be the discovery application. inherited function from base viewer
                 */
                loadControllers: function () {
                    if (this.queryConfig.createAnalysisWidget == null || this.queryConfig.createAnalysisWidget != false) {
                        this.createImageManipulationWidget();
                    }
                    //image info widget displays a results thumbnail and attributes
                    // this.createImageInfoWidget();
                    //image discovery widget allows the user to locate and discover imagery
                    this.createImageDiscoveryWidget();

                    // this.createSearcherWidget();
                    //query controller handles all requests to query catalog services.
                    this.createImageQueryController();
                    this.inherited(arguments);
                },
                /*
                 createSearcherWidget: function () {
                 this.searcherWidget = new GeometrySearcherWidget();

                 },
                 */
                /**
                 *  creates the image discovery widget
                 */
                createImageDiscoveryWidget: function () {
                    if (this.queryConfig.createDiscoveryWidget == null || this.queryConfig.createDiscoveryWidget != false) {
                        if (this.imageDiscoveryWidget == null) {
                            this.imageDiscoveryWidget = new ImageDiscoveryWidget();
                        }
                    }
                },
                /**
                 *  creates the image query controller
                 */
                createImageQueryController: function () {
                    if (this.imageQueryController == null) {
                        this.imageQueryController = new ImageQueryController();
                    }
                },
                /**
                 * overridden in ImageryViewerManagerWindow
                 */
                createImageManipulationWidget: function () {
                },
                /**
                 * called when the esri map has been loaded
                 * @param map the esri map
                 */
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
                                var imageServiceQueryLayer = new ArcGISImageServiceLayer(currentImageServiceObj.url);
                                //see if there is a query to append to all the dynamic queries
                                if (currentImageServiceObj.queryWhereClauseAppend && currentImageServiceObj.queryWhereClauseAppend.length > 0) {
                                    imageServiceQueryLayer.queryWhereClauseAppend = currentImageServiceObj.queryWhereClauseAppend;
                                }
                                imageServiceQueryLayer.searchServiceLabel = currentImageServiceObj.label ? currentImageServiceObj.label : "Search Service " + i;
                                topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD, imageServiceQueryLayer, {
                                    canRemove: false,
                                    isOperationalLayer: false
                                }, lang.hitch(this, this.handleImageServiceLoaded, currentImageServiceObj), lang.hitch(this, this.handleImageServiceLoadError));
                            }
                        }
                    }
                    map.resize();
                    new ShadedThumbnailManager();
                    new ResultPopup();

                },
                /**
                 * called when a catalog service failed to load
                 */
                handleImageServiceLoadError: function () {
                    VIEWER_UTILS.log("There was an error querying a catalog service.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    if (++this.loadedQueryLayersCount == this.queryConfig.imageQueryLayers.length) {
                        this.finalizeQueryLayerLoad();
                    }
                },
                /**
                 * called when a catalog service is loaded
                 *
                 * @param evt  object with layer parameter for the loaded layer
                 * @param catalogServiceConfig
                 */
                handleImageServiceLoaded: function (catalogServiceConfig, evt) {
                    if (evt == null || evt.layer == null) {
                        return;
                    }
                    var layer = evt.layer;
                    //load the key properties
                    var imageQueryLayerController = new ImageQueryLayerController({
                        layer: layer,
                        label: layer.searchServiceLabel,
                        serviceConfiguration: catalogServiceConfig
                    });
                    this.catalogQueryControllers.push(imageQueryLayerController);
                    VIEWER_UTILS.log("Loaded Catalog Service", VIEWER_GLOBALS.LOG_TYPE.INFO);
                    IMAGERY_UTILS.loadKeyProperties(layer, lang.hitch(this, this.handleQueryImageServiceKeyPropertiesLoaded));
                },
                /**
                 * called when a layers key properties could not be loaded
                 * @param layer layer that keyProperties could not be loaded for
                 */
                handleQueryImageServiceKeyPropertiesLoaded: function (layer) {
                    layer.hide();
                    this.catalogLayers.push(layer);
                    if (++this.loadedQueryLayersCount == this.queryConfig.imageQueryLayers.length) {
                        this.finalizeQueryLayerLoad();
                    }
                },
                /**
                 * called when all of the catalog layers have been processed. this destroys the loading services container
                 */
                finalizeQueryLayerLoad: function () {
                    if (this.serviceLoadingContainer) {
                        domConstruct.destroy(this.serviceLoadingContainer);
                    }
                    VIEWER_UTILS.log("Publishing catalog layer to widgets", VIEWER_GLOBALS.LOG_TYPE.INFO);
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.LOADED, this.catalogQueryControllers);
                    if (this.viewerAccordion) {
                        this.viewerAccordion.show();
                    }
                    //  this.createDiscoveryToolbarButtons();

                    //listen for map click to do an identify over all catalogs
                    new MapIdentifyPopupTooltip();
                    this.map.on("click", lang.hitch(this, function (evt) {
                        if (this.applicationDrawInProgress) {
                            return;
                        }
                        var cartVisible = false;
                        topic.publish(IMAGERY_GLOBALS.EVENTS.CART.IS_VISIBLE, function (vis) {
                            cartVisible = vis;
                        });
                        if (cartVisible || (this.identifyEnabledZoomLevel > this.map.getLevel())) {
                            //not within the start zoom level
                            return;
                        }
                        var screenCoordinates = screenUtils.toScreenGeometry(this.map.extent, this.map.width, this.map.height, evt.mapPoint);
                        var clickHandler = lang.hitch(this, function (response) {
                            topic.publish(IMAGERY_GLOBALS.EVENTS.IDENTIFY.ADD_RESULT, response);
                        });
                        topic.publish(IMAGERY_GLOBALS.EVENTS.IDENTIFY.BY_POINT, evt.mapPoint, screenCoordinates, clickHandler, function () {
                            }
                        );
                    }));


                },
                /**
                 *  add discovery button and analysis button to the toolbar
                 */

                processNavigationToolbarAddons: function () {
                    if (this.queryConfig.createDiscoveryWidget == null || this.queryConfig.createDiscoveryWidget != false) {
                        var accordionButton = new Button({
                            buttonClass: "commonIcons16 binoculars",
                            buttonText: "Discover",
                            onClick: lang.hitch(this, this.handleShowDiscovery)
                        });
                        accordionButton.placeAt(this.navigationToolbar.navigationToolbar);

                    }
                    if (this.queryConfig.createAnalysisWidget == null || this.queryConfig.createAnalysisWidget != false) {
                        var analysisButton = new Button({
                            buttonClass: "imageryIcons analysis",
                            buttonText: "Analysis",
                            onClick: lang.hitch(this, function () {
                                topic.publish(IMAGERY_GLOBALS.EVENTS.MANIPULATION.WINDOW.TOGGLE);
                            })
                        });
                        analysisButton.placeAt(this.navigationToolbar.navigationToolbar);
                    }
                },

                /**
                 * called when a query result has been received from ArcGIS Server
                 * @param response  query response object
                 * @param queryLayerController controller that the response is associated with
                 */
                //todo   handleImageQueryResultsResponse: function (response, queryLayerController) {
                handleImageQueryResultsResponse: function (queryResults) {
                    //expand the footer to show the results grid
                    topic.publish(VIEWER_GLOBALS.EVENTS.FOOTER.EXPAND);
                    //create the query results widget if it doesn't exist
                    if (this.imageryQueryResultsWidget == null) {
                        this.createImageQueryResultsWidget();
                    }
                    //set the results on the grid
                    //  this.imageryQueryResultsWidget.addQueryResults(response, queryLayerController);
                    this.imageryQueryResultsWidget.addQueryResults(queryResults);
                },
                /**
                 *  called when the base viewer configuration has been loaded
                 */
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
                /**
                 * called when the discovery applications configuration json has been loaded
                 * @param queryConfig  configuration object for the discovery application
                 */
                handleQueryWidgetConfigurationLoaded: function (queryConfig) {
                    //set the query config on the class instance
                    this.queryConfig = queryConfig;
                    //check configuration for manually adding catalog services. configured services in json are ignored if this flag is true
                    this.resultFieldNameToLabelLookup = {};
                    for (var i = 0; i < this.queryConfig.imageQueryResultDisplayFields.length; i++) {
                        this.resultFieldNameToLabelLookup[this.queryConfig.imageQueryResultDisplayFields[i].field] = this.queryConfig.imageQueryResultDisplayFields[i].label;
                    }
                    if (this.queryConfig.identify != null) {
                        if (this.queryConfig.identify.enabledZoomLevel != null) {
                            try {
                                this.identifyEnabledZoomLevel = parseInt(this.queryConfig.identify.enabledZoomLevel, 10);
                            }
                            catch (err) {

                            }
                        }

                    }
                    if (this.queryConfig.userAddCatalogMode === true) {
                        this.initUserAddCatalogMode();
                    }
                    else {
                        //start up the viewer
                        this.startupViewer();
                    }
                },
                /**
                 * starts up the base viewer and displays catalog loading element
                 */
                startupViewer: function () {
                    this.displayCatalogLoading();
                    this.inherited(arguments);
                },
                /**
                 * loads the add catalog widget and displays it as a modal window for discovery application
                 */
                initUserAddCatalogMode: function () {
                    require(["imagediscovery/ui/catalog/AddCatalogModalWindow"], lang.hitch(this, function (AddCatalogModalWindow) {
                        var addCatalogModalWindow = new AddCatalogModalWindow();
                        addCatalogModalWindow.on("catalogSet", lang.hitch(this, function (catalogParams) {

                            lang.mixin(this.queryConfig, catalogParams);
                            addCatalogModalWindow.destroy();
                            this.startupViewer();
                        }));
                    }));

                },
                /**
                 * called when the discovery application configuration file could not be loaded. The viewer is not functional if this function is called
                 */
                handleQueryConfigLoadFailed: function () {
                    //show error since query json configuration load failed
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not load query configuration. Application is not functional", 100000);
                },
                /**
                 * creates the discovery application query results widget. the contents of this widget is presented in the base viewers footer widget
                 */
                createImageQueryResultsWidget: function () {
                    //need to set the catalog layer on this class because it wasn't create when the catalog layer was found
                    if (this.imageryQueryResultsWidget == null) {
                        this.imageryQueryResultsWidget = new ImageQueryResultsWidget();
                        this.footerTogglerWidget.setContent(this.imageryQueryResultsWidget.domNode);
                        this.imageryQueryResultsWidget.startup();
                    }
                },
                /**
                 * called the first time the base viewers footer is expanded
                 */
                handleFirstFooterShow: function () {
                    //on first footer show create the query results widget so we don't have the overhead on page load
                    if (this.imageryQueryResultsWidget == null) {
                        this.createImageQueryResultsWidget();
                    }
                },
                /**
                 * called when there is a request to show the discovery widget inside the bas viewer accordion
                 */
                handleShowDiscovery: function () {
                    if (this.viewerAccordion == null || this.imageDiscoveryWidget == null) {
                        return;
                    }
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
                /**
                 * creates the discovery applications viewer accordion
                 * @private
                 */
                _createViewerAccordion: function () {
                    this.inherited(arguments);
                    if (this.viewerAccordion) {
                        this.viewerAccordion.hide();
                    }
                },
                /**
                 * called by the base viewer after the UI elements for the base viewer are created
                 */
                finalizeUILoad: function () {
                    this.inherited(arguments);
                    this._loadImageryUIAddons();
                    // this._placeSearchersWidget();
                    this._placeImageDiscoveryWidget();
                },
                /**
                 * called after the discovery viewer's UI elements have been created
                 * @private
                 */
                _loadImageryUIAddons: function () {
                    this._createUploaderWidget();
                    this._createSwipeWidget();
                },
                /**
                 * reads configuration to see if the uploader widget should be created
                 * @private
                 */
                _createUploaderWidget: function () {
                    if (this.viewerConfig.uploaderWidget != null && lang.isObject(this.viewerConfig.uploaderWidget) && this.viewerConfig.uploaderWidget.create) {
                        this.createUploaderWidget();
                    }
                },
                /**
                 * reads configuration to see if the swipe widget should be created
                 * @private
                 */
                _createSwipeWidget: function () {
                    if (this.viewerConfig.swipeWidget != null && lang.isObject(this.viewerConfig.swipeWidget) && this.viewerConfig.swipeWidget.create) {
                        this.createSwipeWidget();
                    }
                },
                /**
                 * inherited in ImageryViewerManagerWindow to create the swipe widget
                 */
                createSwipeWidget: function () {
                },
                /**
                 * called when the discovery widget is ready to be placed
                 * @private
                 */
                _placeImageDiscoveryWidget: function () {
                    if (this.imageDiscoveryWidget) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.PLACEMENT.GLOBAL.PLACE.DISCOVERY_WIDGET, this.imageDiscoveryWidget, this.imageDiscoveryWidget.title);
                    }
                },
                _placeSearchersWidget: function () {
                    if (this.searcherWidget) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.PLACEMENT.GLOBAL.PLACE.SEARCHER_WIDGET, this.searcherWidget, this.searcherWidget.title);
                    }
                },

                /**
                 * called when finalize UI load is complete
                 */
                handleFinalizeUILoadComplete: function () {
                    //move the throbber and the messaging widget if the header is displayed
                    if (this.viewerConfig.header != null && lang.isObject(this.viewerConfig.header) &&
                        this.viewerConfig.header.display) {
                        if (this.viewerConfig.header.small) {
                            if (this.loadingThrobber) {
                                domStyle.set(this.loadingThrobber.domNode, "left", "20%");
                            }
                            if (this.messagingWidget) {
                                domStyle.set(this.messagingWidget.domNode, "left", "25%");
                            }
                        }
                        else {
                            if (this.loadingThrobber) {
                                domStyle.set(this.loadingThrobber.domNode, "left", "35%");
                            }
                            if (this.messagingWidget) {
                                domStyle.set(this.messagingWidget.domNode, "left", "45%");
                            }
                        }
                    }
                    else {
                        if (this.viewerConfig.toolsBar && this.viewerConfig.toolsBar.showExtentActionsOnMap && this.viewerConfig.toolsBar.showExtentActions) {
                            if (this.loadingThrobber) {
                                domStyle.set(this.loadingThrobber.domNode, "left", "225px");
                            }
                            if (this.messagingWidget) {
                                domStyle.set(this.messagingWidget.domNode, "left", "325px");
                            }
                        }
                    }
                },
                /**
                 *     extend the function to add the footprints toggle button
                 *     @private
                 */
                tweakMainToolbar: function () {
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
    })
;