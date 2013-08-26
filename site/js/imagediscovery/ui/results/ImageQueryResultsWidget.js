define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageQueryResultTemplate.html",
    "xstyle/css!./theme/ImageQueryResultsTheme.css",
    "dojo/topic",
    "dojo/_base/xhr",
    "dojo/query",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/on",
    "dijit/form/Button",
    "esri/geometry/Point",
    "esri/geometry/Extent",
    "esriviewer/ui/base/UITemplatedWidget",
    "esriviewer/ui/tooltip/ConfirmTooltip",
    "./ImageQueryResultsGrid",
    "../cart/grid/ShoppingCartGrid",
    "../time/ImageryTimeSliderWindowWidget",
    "./model/ImageQueryResultsViewModel",
    "../filter/FilterFunctionManager" ,
    "../cart/checkout/ShoppingCartCheckoutHandler",
    "./base/ActiveSourcesWidget",
    "esriviewer/ui/draw/base/MapDrawSupport",
    "dijit/TooltipDialog",
    "./ResultsClusterManager",
    "./ResultsHeatmapManager",
    "./ResultsFootprintManager"
],
    function (declare, template, theme, topic, xhr, query, lang, domConstruct, domAttr, domClass, domStyle, on, Button, Point, Extent, UITemplatedWidget, ConfirmTooltip, ImageQueryResultsGrid, ShoppingCartGrid, ImageryTimeSliderWindowWidget, ImageQueryResultsViewModel, FilterFunctionManager, ShoppingCartCheckoutHandler, ActiveSourcesWidget, MapDrawSupport, TooltipDialog, ResultsClusterManager, ResultsHeatmapManager, ResultsFootprintManager) {
        return declare(
            [UITemplatedWidget, MapDrawSupport],
            {
                footprintZoomLevelStart: 12,
                bindingsApplied: false,
                useHeatmap: false,
                generateCSVEndpoint: "generateCSV",
                title: "Results",
                templateString: template,
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    if (this.resultFields === null) {
                        this.resultFields = [];
                    }
                    this.envelopeOptions = {showTooltips: false};
                    this.pointOptions = {showTooltips: false};
                },
                initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_UNIQUE_VISIBLE_RASTER_ATTRIBUTES, lang.hitch(this, this.handleGetVisibleRasterAttributes));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_UNIQUE_VISIBLE_ROW_ATTRIBUTES, lang.hitch(this, this.handleGetVisibleRowAttributes));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.QUERY_RESULT_SET, lang.hitch(this, this.handleQueryResultsSet));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.handleClearQueryResults));
                    this.firstFooterExpandListener = topic.subscribe(VIEWER_GLOBALS.EVENTS.FOOTER.EXPANDED, lang.hitch(this, this.handleFooterFirstExpand));
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.FOOTER.COLLAPSED, lang.hitch(this, this.clearDraw));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.IS_VISIBLE, lang.hitch(this, this.handleIsShoppingCartVisible));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.HIDE_RESET_ICON, lang.hitch(this, this.hideFilterResultIcon));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.SHOW_RESET_ICON, lang.hitch(this, this.showFilterResetIcon));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.TIME_SLIDER.HIDE_ICON, lang.hitch(this, this.hideTimeSliderIcon));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.TIME_SLIDER.SHOW_ICON, lang.hitch(this, this.showTimeSliderIcon));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.COMPLETE, lang.hitch(this, this.checkForToolsActive));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.APPLIED, lang.hitch(this, this.handleFilterApplied));
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.MAP.LEVEL.CHANGED, lang.hitch(this, this.handleZoomLevelChange));
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.createClusterManager();
                    this.createFootprintManager();
                    this.filterFunctionManager = new FilterFunctionManager();
                    this.viewModel = new ImageQueryResultsViewModel();
                    this.viewModel.expanded.subscribe(lang.hitch(this, this.toggleGrid));
                    this.viewModel.cart.subscribe(lang.hitch(this, this.handleCartVisibilityChange));
                    this.viewModel.results.subscribe(lang.hitch(this, this.handleResultsVisibilityChange));
                    this.viewModel.resultsVisibleAndHasResults.subscribe(lang.hitch(this, this.handleFilterIconStateChange));
                    this.viewModel.on(this.viewModel.ACTIVATE_RECTANGLE_SELECT, lang.hitch(this, this.handleActivateRectangleSelect));
                    this.viewModel.on(this.viewModel.CLEAR_DRAW, lang.hitch(this, this.clearDraw));
                    this.viewModel.setFilterIconHidden();
                    this.applyBindings();
                    this._createResultGrid();
                    this._createShoppingCartGrid();
                    this.createActiveSourcesWidget();
                },
                checkForToolsActive: function (level) {
                    if (level == null) {
                        var zoomLevel;
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.GET_LEVEL, lang.hitch(this, function (mapLevel) {
                            zoomLevel = mapLevel;
                        }));
                        level = zoomLevel;
                    }
                    if (level < this.footprintZoomLevelStart) {
                        this.viewModel.toolsActive(false);
                        this.clearDraw();
                        topic.publish(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.HIDE);
                    }
                    else {
                        this.viewModel.toolsActive(true);
                    }
                },
                handleZoomLevelChange: function (extent, factor, anchor, level) {
                    if (this.viewModel.cart()) {
                        return;
                    }
                    //hide the select tools if we are in clustering
                    this.checkForToolsActive();
                    //check to see if we dsiplay/hide the footprints layer
                    if (this.resultsFootprintManager) {
                        if (level < this.footprintZoomLevelStart) {
                            if (this.resultsFootprintManager.isVisible()) {
                                this.resultsFootprintManager.hideLayer();
                            }
                        }
                        else {
                            if (!this.resultsFootprintManager.isVisible()) {
                                this.resultsFootprintManager.showLayer();
                            }
                        }
                    }
                    //check to see if we display/hide the cluster layer
                    if (this.resultsClusterManager && this.resultsClusterManager.layerExists()) {
                        if (level >= this.footprintZoomLevelStart) {
                            if (this.resultsClusterManager.isVisible()) {
                                this.resultsClusterManager.hideLayer();
                            }
                        }
                        else {
                            if (!this.resultsClusterManager.isVisible()) {
                                this.resultsClusterManager.showLayer();
                            }
                        }
                    }
                },
                handleFilterApplied: function () {
                    //update the result count
                    if (this.resultsGridWidget) {
                        var count = this.resultsGridWidget.getVisibleItemCount();
                        this.viewModel.resultCount(count);
                    }
                },
                applyBindings: function () {
                    if (!this.bindingsApplied) {
                        ko.applyBindings(this.viewModel, this.domNode);
                        this.bindingsApplied = true;
                    }
                },
                createActiveSourcesWidget: function () {
                    //create active sources widget
                    this.activeSourcesWidget = new ActiveSourcesWidget();
                    this.activeSourcesWidget.placeAt(this.activeServicesContainer);
                },
                handleActivateRectangleSelect: function () {
                    this.currentDrawType = VIEWER_GLOBALS.EVENTS.MAP.TOOLS.DRAW_RECTANGLE;
                    this.setDraw(VIEWER_GLOBALS.EVENTS.MAP.TOOLS.DRAW_RECTANGLE);
                },
                geometryAdded: function (geometry) {
                    if (geometry instanceof Extent) {
                        if (this.viewModel.rectangleSelectionActive()) {
                            if (this.identifyContainsRadioBtn.checked) {
                                topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.HIGHLIGHT_RESULTS_FOM_RECTANGLE_INTERSECT,
                                    geometry, true);
                            }
                            else {
                                topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.HIGHLIGHT_RESULTS_FOM_RECTANGLE_INTERSECT,
                                    geometry, false);
                            }
                        }
                    }
                    this.setDraw(this.currentDrawType);
                },
                clearDraw: function () {
                    this.inherited(arguments);
                    this.currentDrawType = null;
                    topic.publish(VIEWER_GLOBALS.EVENTS.DRAW.USER.DRAW_CANCEL);
                    this.viewModel.clearAllDraw();
                },
                loadViewerConfigurationData: function () {
                    var searchConfiguration = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "searchConfiguration", function (searchConf) {
                        searchConfiguration = searchConf;
                    });
                    if (searchConfiguration != null && lang.isObject(searchConfiguration)) {
                        if (searchConfiguration.footprintZoomLevelStart != null) {
                            this.footprintZoomLevelStart = searchConfiguration.footprintZoomLevelStart;
                        }
                        if (searchConfiguration.useHeatmap != null) {
                            this.useHeatmap = searchConfiguration.useHeatmap;
                        }
                    }
                    var displayFieldsConfig;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageQueryResultDisplayFields", function (displayFieldsConf) {
                        displayFieldsConfig = displayFieldsConf;
                    });
                    if (displayFieldsConfig != null && lang.isObject(displayFieldsConfig)) {
                        this.resultFields = displayFieldsConfig;
                    }
                    var resultsFormattingConfig = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "resultsFormatting", function (resultsFormattingConf) {
                        resultsFormattingConfig = resultsFormattingConf;
                    });
                    if (resultsFormattingConfig && lang.isObject(resultsFormattingConfig)) {
                        if (resultsFormattingConfig.displayFormats && lang.isObject(resultsFormattingConfig.displayFormats)) {
                            this.displayFormats = resultsFormattingConfig.displayFormats;
                        }
                        if (resultsFormattingConfig.floatPrecision != null) {
                            this.floatPrecision = parseInt(resultsFormattingConfig.floatPrecision, 10);
                        }
                    }
                    var exportConfiguration = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "exportConfiguration", function (exportConf) {
                        exportConfiguration = exportConf;
                    });
                    if (exportConfiguration != null && lang.isObject(exportConfiguration)) {
                        if (exportConfiguration.image && lang.isObject(exportConfiguration.image)) {
                            this.exportImageParameters = exportConfiguration.image;
                        }
                    }
                },
                _createShoppingCartGrid: function () {
                    this.shoppingCartGridWidget = new ShoppingCartGrid(this.getCartGridParameters());
                    domConstruct.place(this.shoppingCartGridWidget.domNode, this.shoppingCartGridContainer);
                    this.shoppingCartGridWidget.startup();
                },
                _createResultGrid: function () {
                    if (this.resultsGridWidget == null) {
                        this.resultsGridWidget = new ImageQueryResultsGrid(this.getResultGridParameters());
                        domConstruct.place(this.resultsGridWidget.domNode, this.resultGridContainer);
                        this.resultsGridWidget.on("hideFilterResetIcon", lang.hitch(this.viewModel, this.viewModel.setFilterIconHidden));
                        this.resultsGridWidget.on("showFilterResetIcon", lang.hitch(this.viewModel, this.viewModel.setFilterIconVisible));
                        this.resultsGridWidget.startup();
                    }
                },
                getCartGridParameters: function () {
                    return {};
                },
                getResultGridParameters: function () {
                    return {};
                },
                handleFooterFirstExpand: function () {
                    //hide the cart on first expand. the grid will not render properly if it's not in view when created
                    this.viewModel.cart(false);
                    this.firstFooterExpandListener.remove();
                },
                handleFilterIconStateChange: function (visible) {
                    if (!visible) {
                        this.hideFilterResetTooltip();
                    }
                },
                handleQueryResultsSet: function (queryObject, callback) {
                    if (callback == null || !lang.isFunction(callback)) {
                        return;
                    }
                    callback(this.resultsGridWidget.queryResultSet(queryObject));
                },
                toggleClearAllResultsTooltip: function () {
                    if (this.clearResultsTooltip == null) {
                        this.createClearResultsTooltip();
                    }
                    if (this.clearResultsTooltip.visible) {
                        this.clearResultsTooltip.hide();
                    }
                    else {
                        this.showClearResultsTooltip();
                    }
                },
                showClearResultsTooltip: function () {
                    if (this.clearResultsTooltip == null) {
                        this.createClearResultsTooltip();
                    }
                    if (this.clearResultsTooltip) {
                        this.clearResultsTooltip.show();
                    }
                },
                createClearResultsTooltip: function () {
                    this.clearResultsTooltip = new ConfirmTooltip({
                        confirmCallback: lang.hitch(this, this.clearResults),
                        aroundNode: this.clearResultsElement,
                        displayText: "Clear Results? "
                    });
                },
                handleResultsVisibilityChange: function (visible) {
                    //results view
                    if (visible) {
                        //cart locked the filters. so set them back to visible
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.REMOVE_USER_LOCK, this);
                        this.shoppingCartGridWidget.hideVisibleFootprints();
                        this.resultsGridWidget.setSelectedThumbnails();
                        this.resultsGridWidget.restoreVisibleFootprints();
                        //hide the time slider if it is open
                        topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.TIME.WINDOW.HIDE);
                        this.checkForClusterLayerVisibility();
                        this.checkForFootprintLayerVisibility();
                    }
                },
                handleCartVisibilityChange: function (visible) {
                    if (visible) {
                        //shopping cart view
                        topic.publish(IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP);
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.ADD_USER_LOCK, this);
                        this.resultsGridWidget.hideVisibleFootprints();
                        this.shoppingCartGridWidget.restoreVisibleFootprints();
                        this.shoppingCartGridWidget.setSelectedThumbnails();
                        topic.publish(IMAGERY_GLOBALS.EVENTS.CART.DISPLAYED);
                        //can only select features in the results table
                        this.clearDraw();
                        //hide the feature and cluster layers
                        if (this.resultsFootprintManager && this.resultsFootprintManager.isVisible()) {
                            this.resultsFootprintManager.hideLayer();
                        }
                        if (this.resultsClusterManager && this.resultsClusterManager.layerExists() && this.resultsClusterManager.isVisible()) {
                            this.resultsClusterManager.hideLayer();
                        }
                    }
                    else {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.CART.HIDDEN);
                        if (this.shoppingCartCheckoutHandler) {
                            this.shoppingCartCheckoutHandler.hide();
                        }
                    }
                },
                handleIsShoppingCartVisible: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.viewModel.cart());
                    }
                },
                handleGetVisibleRowAttributes: function (fieldsArray, callback, queryParams) {
                    if (callback == null || !lang.isFunction(callback)) {
                        return;
                    }
                    if (this.viewModel.cart()) {
                        callback(this.shoppingCartGridWidget.getUniqueVisibleGridAttributes(fieldsArray, queryParams));
                    }
                    else {
                        callback(this.resultsGridWidget.getUniqueVisibleGridAttributes(fieldsArray, queryParams));
                    }
                },
                handleGetVisibleRasterAttributes: function (fieldsArray, callback, queryParams) {
                    if (callback == null || !lang.isFunction(callback)) {
                        return;
                    }
                    if (this.viewModel.cart()) {
                        callback(this.shoppingCartGridWidget.getUniqueVisibleThumbnailAttributes(fieldsArray, queryParams));
                    }
                    else {
                        callback(this.resultsGridWidget.getUniqueVisibleThumbnailAttributes(fieldsArray, queryParams));
                    }
                },
                handleClearQueryResults: function () {
                    //see if the cart is visible. if it is we need to refresh since clear results
                    if (this.viewModel.cart()) {
                        this.shoppingCartGridWidget.setSelectedThumbnails();
                    }
                    this.viewModel.resultCount(0);
                    this.clearDraw();
                    VIEWER_UTILS.debug("Cleared Results");
                },
                clearResults: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR);
                    topic.publish(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.HIDE);
                },
                zoomToVisibleThumbnailExtent: function () {
                    if (this.viewModel.cart()) {
                        if (this.shoppingCartGridWidget) {
                            this.shoppingCartGridWidget.zoomToVisibleRasters();
                        }
                    }
                    else {
                        if (this.resultsGridWidget) {
                            this.resultsGridWidget.zoomToVisibleRasters();
                        }
                    }
                },
                toggleResetResultFiltersTooltip: function () {
                    if (this.resetAllFiltersTooltip == null) {
                        this.createResetAllFiltersTooltip();
                    }
                    if (this.resetAllFiltersTooltip.visible) {
                        this.hideFilterResetTooltip();
                    }
                    else {
                        this.showResetFiltersTooltip();
                    }
                },
                hideTimeSliderIcon: function () {
                    this.viewModel.timeSlider(false);
                },
                showTimeSliderIcon: function () {
                    this.viewModel.timeSlider(true);
                },
                hideFilterResultIcon: function () {
                    this.viewModel.setFilterIconHidden();
                },
                showFilterResetIcon: function () {
                    //only displays if the results grid is visible
                    this.viewModel.setFilterIconVisible();
                },
                hideFilterResetTooltip: function () {
                    if (this.resetAllFiltersTooltip && this.resetAllFiltersTooltip.visible) {
                        this.resetAllFiltersTooltip.hide();
                    }
                },
                showResetFiltersTooltip: function () {
                    if (this.resetAllFiltersTooltip == null) {
                        this.createResetAllFiltersTooltip();
                    }
                    if (this.resetAllFiltersTooltip) {
                        this.resetAllFiltersTooltip.show();
                    }
                },
                createResetAllFiltersTooltip: function () {
                    this.resetAllFiltersTooltip = new ConfirmTooltip({
                        confirmCallback: lang.hitch(this, this.resetFilters),
                        aroundNode: this.resetAllFiltersIcon,
                        displayText: "Reset Filters? "
                    });
                },
                resetFilters: function () {
                    this.resultsGridWidget.resetAllFilters();
                },
                addQueryResults: function (results, queryLayerController) {
                    this.resultsClusterManager.addResults(results, queryLayerController);
                    this.resultsFootprintManager.addResults(results, queryLayerController);
                    VIEWER_UTILS.log("Populating Query Results Grid", VIEWER_GLOBALS.LOG_TYPE.INFO);
                    if (this.viewModel.cart()) {
                        this.viewModel.toggleGrid();
                    }
                    this.resultsGridWidget.populateQueryResults(results, queryLayerController);
                    this.viewModel.resultCount(this.viewModel.resultCount() + results.features.length);
                    if (results.features.length > 0) {
                        if (this.activeSourcesWidget != null) {
                            this.activeSourcesWidget.addQueryLayerControllerEntry(queryLayerController);
                        }
                    }
                },
                createClusterManager: function () {
                    if (this.useHeatmap) {
                        this.resultsClusterManager = new ResultsHeatmapManager();
                    }
                    else {
                        this.resultsClusterManager = new ResultsClusterManager();
                    }
                    //see if the layer should be hidden/displayed on creation
                    this.resultsClusterManager.on("clusterLayerCreated", lang.hitch(this, this.checkForClusterLayerVisibility));
                    this.resultsClusterManager.startup();
                },
                checkForClusterLayerVisibility: function () {
                    var zoomLevel;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.GET_LEVEL, function (mapLevel) {
                        zoomLevel = mapLevel;
                    });
                    if (zoomLevel >= this.footprintZoomLevelStart) {
                        if (this.resultsClusterManager.isVisible()) {
                            this.resultsClusterManager.hideLayer();
                        }
                    }
                    else {
                        if (!this.resultsClusterManager.isVisible()) {
                            this.resultsClusterManager.showLayer();
                        }
                    }
                },
                createFootprintManager: function () {
                    this.resultsFootprintManager = new ResultsFootprintManager();
                    //see if the layer should be hidden/displayed on creation
                    this.resultsFootprintManager.on("footprintsLayerCreated", lang.hitch(this, this.checkForFootprintLayerVisibility));
                    this.resultsFootprintManager.startup();
                },
                checkForFootprintLayerVisibility: function () {
                    var zoomLevel;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.GET_LEVEL, function (mapLevel) {
                        zoomLevel = mapLevel;
                    });
                    if (zoomLevel < this.footprintZoomLevelStart) {
                        if (this.resultsFootprintManager.isVisible()) {
                            this.resultsFootprintManager.hideLayer();
                        }
                    }
                    else {
                        if (!this.resultsFootprintManager.isVisible()) {
                            this.resultsFootprintManager.showLayer();
                        }
                    }
                },
                startup: function () {
                    this.inherited(arguments);
                    this.resultsGridWidget.grid.resize();
                    this.shoppingCartGridWidget.grid.resize();
                },
                toggleGrid: function (expand) {
                    if (expand) {
                        this.shoppingCartGridWidget.expandGrid();
                        this.resultsGridWidget.expandGrid();
                    }
                    else {
                        this.shoppingCartGridWidget.shrinkGrid();
                        this.resultsGridWidget.shrinkGrid();
                    }
                },
                toggleTimeSlider: function () {
                    if (this.imageryTimeSliderWindow == null) {
                        this.imageryTimeSliderWindow = new ImageryTimeSliderWindowWidget();
                    }
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.TIME.WINDOW.SHOW);
                },
                handleCheckoutCartClick: function () {
                    if (this.shoppingCartCheckoutHandler == null) {
                        this.shoppingCartCheckoutHandler = new ShoppingCartCheckoutHandler();
                    }
                    this.shoppingCartCheckoutHandler.checkout();
                },
                toggleResultLayerTransparencyPopup: function () {
                    if (this.layerTransparencyTooltip == null) {
                        require(["imagediscovery/ui/transparency/SearchLayersTransparencyWidget"],
                            lang.hitch(this, function (TransparencyWidget) {
                                var transparencyWidget = new TransparencyWidget();
                                this.layerTransparencyTooltip = new TooltipDialog({
                                    content: transparencyWidget.domNode
                                });
                            })
                        );
                        this.layerTransparencyTooltipVisible = false;
                        topic.subscribe(IMAGERY_GLOBALS.EVENTS.TRANSPARENCY.POPUP.HIDE,
                            dojo.hitch(this, this.hideResultLayerTransparencyPopup));
                    }
                    var params = {
                        popup: this.layerTransparencyTooltip //content of popup is the TootipDialog
                    };
                    if (this.layerTransparencyTooltipVisible) {
                        dijit.popup.close(this.layerTransparencyTooltip);
                        this.layerTransparencyTooltipVisible = false;
                    }
                    else {
                        params.around = this.changeResultLayerTransparencyElement;
                        params.orient = ["above"];
                        dijit.popup.open(params);
                        this.layerTransparencyTooltipVisible = true;
                    }
                },
                hideResultLayerTransparencyPopup: function () {
                    if (this.layerTransparencyTooltipVisible) {
                        dijit.popup.close(this.layerTransparencyTooltip);
                        this.layerTransparencyTooltipVisible = false;
                    }
                }
            });
    });