define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageQueryResultTemplate.html",
    "xstyle/css!./theme/ImageQueryResultsTheme.css",
    "dojo/topic",
    "dijit/popup",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dijit/form/Button",
    "esriviewer/ui/base/UITemplatedWidget",
    "esriviewer/ui/tooltip/ConfirmTooltip",
    "./ImageQueryResultsGrid",
    "../cart/grid/ShoppingCartGrid",
    "../time/ImageryTimeSliderWindowWidget",
    "./model/ImageQueryResultsViewModel",
    "../filter/FilterFunctionManager" ,
    "../cart/checkout/ShoppingCartCheckoutHandler",
    "./base/ActiveSourcesWidget",
    "dijit/TooltipDialog",
    "./ResultsClusterManager",
    "./ResultsHeatmapManager",
    "./ResultsFootprintManager",
    "../transparency/SearchLayersTransparencyWidget"
],
    function (declare, template, theme, topic, popup, lang, domConstruct, Button, UITemplatedWidget, ConfirmTooltip, ImageQueryResultsGrid, ShoppingCartGrid, ImageryTimeSliderWindowWidget, ImageQueryResultsViewModel, FilterFunctionManager, ShoppingCartCheckoutHandler, ActiveSourcesWidget, TooltipDialog, ResultsClusterManager, ResultsHeatmapManager, ResultsFootprintManager, SearchLayersTransparencyWidget) {
        return declare(
            [UITemplatedWidget],
            {
                footprintZoomLevelStart: 0,
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
                    this.firstFooterExpandListener = topic.subscribe(VIEWER_GLOBALS.EVENTS.FOOTER.EXPANDED, lang.hitch(this, this.handleFooterFirstExpand));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_UNIQUE_VISIBLE_RASTER_ATTRIBUTES, lang.hitch(this, this.handleGetVisibleRasterAttributes));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_UNIQUE_VISIBLE_ROW_ATTRIBUTES, lang.hitch(this, this.handleGetVisibleRowAttributes));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.QUERY_RESULT_SET, lang.hitch(this, this.handleQueryResultsSet));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.handleClearQueryResults));
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.FOOTER.COLLAPSED, lang.hitch(this, this.handleFooterCollapsed));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.IS_VISIBLE, lang.hitch(this, this.handleIsShoppingCartVisible));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.HIDE_RESET_ICON, lang.hitch(this, this.hideFilterResultIcon));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.SHOW_RESET_ICON, lang.hitch(this, this.showFilterResetIcon));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.TIME_SLIDER.HIDE_ICON, lang.hitch(this, this.hideTimeSliderIcon));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.TIME_SLIDER.SHOW_ICON, lang.hitch(this, this.showTimeSliderIcon));
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.MAP.LEVEL.CHANGED, lang.hitch(this, this.handleZoomLevelChange));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.CHANGED, lang.hitch(this, this.handleLockRasterChanged));
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.createClusterManager();
                    this.createFootprintManager();
                    this.filterFunctionManager = new FilterFunctionManager();
                    this.viewModel = this.createViewModel();
                    this.viewModel.expanded.subscribe(lang.hitch(this, this.toggleGrid));
                    this.viewModel.cart.subscribe(lang.hitch(this, this.handleCartVisibilityChange));
                    this.viewModel.results.subscribe(lang.hitch(this, this.handleResultsVisibilityChange));
                    this.viewModel.resultsVisible.subscribe(lang.hitch(this, this.handleFilterIconStateChange));
                    this.viewModel.setFilterIconHidden();
                    this.itemHasVisibleThumbnailScoped = lang.hitch(this, this.itemThumbNailVisible);


                    //check to see if there are multiple sources
                    var singleSourceMode = true;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (queryLayerControllers) {
                        if (queryLayerControllers != null && queryLayerControllers.length > 1) {
                            singleSourceMode = false;
                        }
                    });
                    if (singleSourceMode) {
                        this.viewModel.forceSourceFilterHide(true);
                    }

                    this.applyBindings();
                    this._createResultGrid();
                    this._createShoppingCartGrid();
                    if (!singleSourceMode) {
                        this.createActiveSourcesWidget();
                    }
                },
                createViewModel: function () {
                    return new ImageQueryResultsViewModel();
                },
                handleFooterCollapsed: function () {
                    this._hideActiveSourcesTooltip();
                    this.hideResultLayerTransparencyPopup();
                    if (this.clearResultsTooltip && this.clearResultsTooltip.visible) {
                        this.clearResultsTooltip.hide();
                    }
                    if (this.resetAllFiltersTooltip && this.resetAllFiltersTooltip.visible) {
                        this.resetAllFiltersTooltip.hide();
                    }
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
                /**
                 * listener for VIEWER_GLOBALS.EVENTS.MAP.LEVEL.CHANGED
                 * figures out if the discovery application should display the cluser layer or the footprint layer
                 * @param extent
                 * @param factor
                 * @param anchor
                 * @param level
                 */
                handleZoomLevelChange: function (extent, factor, anchor, level) {
                    if (this.viewModel.cart()) {
                        return;
                    }
                    //hide the select tools if we are in clustering
                    //  this.checkForToolsActive();
                    //check to see if we display/hide the footprints layer
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
                applyBindings: function () {
                    if (!this.bindingsApplied) {
                        ko.applyBindings(this.viewModel, this.domNode);
                        this.bindingsApplied = true;
                    }
                },
                handleLockRasterChanged: function () {
                    //if only displayed is checked we need to reload the filter function to refresh the results view
                    if (this.viewModel.showOnlyCheckedFootprints()) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.RELOAD_FILTER_FUNCTION, this.itemHasVisibleThumbnailScoped);
                    }

                },
                _toggleShowItemsWithVisibleThumbnails: function () {
                    var curr = this.viewModel.showOnlyCheckedFootprints();
                    if (curr) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.REMOVE_FILTER_FUNCTION, this.itemHasVisibleThumbnailScoped);
                    }
                    else {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.ADD_FILTER_FUNCTION, this.itemHasVisibleThumbnailScoped);
                    }
                    this.viewModel.showOnlyCheckedFootprints(!curr);
                },
                itemThumbNailVisible: function (item) {
                    return item.showThumbNail;
                },

                /**
                 * creates the active sources with inside the result widget
                 */
                createActiveSourcesWidget: function () {
                    //active sources widget allows the user to toggle visibility of results for each services search results
                    if (this.activeSourcesWidget == null) {
                        this.activeSourcesWidget = new ActiveSourcesWidget();

                        this.activeSourcesTooltipVisible = false;
                        this.activeSourcesTooltip = new TooltipDialog({
                            content: this.activeSourcesWidget.domNode
                        });
                        this.activeSourcesTooltip.on("hide", lang.hitch(this, function () {
                            this.activeSourcesTooltipVisible = false;
                        }));
                    }
                },
                _toggleActiveSourcesTooltip: function () {
                    if (!this.activeSourcesTooltipVisible) {
                        this._showActiveSourcesTooltip();
                    }
                    else {
                        this._hideActiveSourcesTooltip();
                    }
                },
                _hideActiveSourcesTooltip: function () {
                    if (this.activeSourcesTooltipVisible && this.activeSourcesTooltip) {
                        popup.close(this.activeSourcesTooltip);
                        this.activeSourcesTooltipVisible = false;
                    }
                },
                _showActiveSourcesTooltip: function () {
                    if (!this.activeSourcesTooltipVisible) {
                        var params = {
                            popup: this.activeSourcesTooltip,
                            around: this.activeSourcesTooltipAnchor,
                            orient: ["above"]
                        };
                        popup.open(params);
                        this.activeSourcesTooltipVisible = true;
                    }
                },
                /**
                 * creates the shopping cart grid
                 * @private
                 */
                _createShoppingCartGrid: function () {
                    if (this.shoppingCartGridWidget == null) {
                        this.shoppingCartGridWidget = new ShoppingCartGrid(this.getCartGridParameters());
                        domConstruct.place(this.shoppingCartGridWidget.domNode, this.shoppingCartGridContainer);
                        this.shoppingCartGridWidget.startup();
                    }
                },
                /**
                 * creates the search result grid
                 * @private
                 */
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
                /**
                 * called when the footer containing the results widget has been expanded the first time
                 */
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
                /*
                 toggles the visibility of the clear all results tooltip
                 */
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
                /**
                 * displays the clear all results tooltip
                 */
                showClearResultsTooltip: function () {
                    if (this.clearResultsTooltip == null) {
                        this.createClearResultsTooltip();
                    }
                    if (this.clearResultsTooltip) {
                        this.clearResultsTooltip.show();
                    }
                },
                /**
                 * creates the clear all results tooltip
                 */
                createClearResultsTooltip: function () {
                    if (this.clearResultsTooltip == null) {
                        this.clearResultsTooltip = new ConfirmTooltip({
                            confirmCallback: lang.hitch(this, this.clearResults),
                            aroundNode: this.clearResultsElement,
                            displayText: "Clear Results? "
                        });
                    }
                },
                /**
                 * called when the results grid visible has changed in the view
                 * @param visible
                 */
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
                /**
                 * called when the shopping cart grid visibility has changed in the view
                 * @param visible
                 */
                handleCartVisibilityChange: function (visible) {
                    if (visible) {
                        //shopping cart view
                        topic.publish(IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP);
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.ADD_USER_LOCK, this);
                        this.resultsGridWidget.hideVisibleFootprints();
                        this.shoppingCartGridWidget.restoreVisibleFootprints();
                        this.shoppingCartGridWidget.setSelectedThumbnails();
                        this.shoppingCartGridWidget.refresh();
                        topic.publish(IMAGERY_GLOBALS.EVENTS.CART.DISPLAYED);
                        //can only select features in the results table
                        //   this.clearDraw();
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
                /**
                 * passes boolean for shopping cart visibility to the passed callback
                 * @param callback
                 */
                handleIsShoppingCartVisible: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.viewModel.cart());
                    }
                },
                /**
                 * returns row attributes to the callback
                 * @param fieldsArray fields to return
                 * @param callback function to return to
                 * @param queryParams options parameters to use as a query against the store
                 * @param forceResultsGrid when true, unique values will be retrieved from the results grid even if it's not the current view
                 */
                handleGetVisibleRowAttributes: function (fieldsArray, callback, queryParams, forceResultsGrid) {

                    if (callback == null || !lang.isFunction(callback)) {
                        return;
                    }
                    if (forceResultsGrid == null) {
                        forceResultsGrid = false
                    }
                    if (this.viewModel.cart() && !forceResultsGrid) {
                        callback(this.shoppingCartGridWidget.getUniqueVisibleGridAttributes(fieldsArray, queryParams));
                    }
                    else {
                        callback(this.resultsGridWidget.getUniqueVisibleGridAttributes(fieldsArray, queryParams));
                    }
                },
                /**
                 * returns row attributes for visible raster results to the callback
                 * @param fieldsArray fields to return
                 * @param callback function to return to
                 * @param queryParams options parameters to use as a query against the store
                 */
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
                /**
                 * clears all query results
                 */
                handleClearQueryResults: function () {
                    //see if the cart is visible. if it is we need to refresh since clear results
                    if (this.viewModel.cart()) {
                        this.shoppingCartGridWidget.setSelectedThumbnails();
                    }
                    this.viewModel.resultCount(0);
                    //   this.clearDraw();
                    if (this.viewModel.showOnlyCheckedFootprints()) {
                        this.viewModel.showOnlyCheckedFootprints(false);
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.REMOVE_FILTER_FUNCTION, this.itemHasVisibleThumbnailScoped);

                    }

                    VIEWER_UTILS.debug("Cleared Results");
                },
                clearResults: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR);
                    topic.publish(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.HIDE);
                },
                /**
                 * zooms to extent of all visible thumbnails
                 */
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
                addQueryResults: function (queryResults) {
                    //todo      this.resultsClusterManager.addResults(results, queryLayerController);
                    VIEWER_UTILS.log("Populating Query Results Grid", VIEWER_GLOBALS.LOG_TYPE.INFO);
                    if (this.viewModel.cart()) {
                        this.viewModel.toggleGrid();
                    }
                    this.resultsGridWidget.populateQueryResults(queryResults);
                    if (queryResults.length > 0) {
                        for (var i = 0; i < queryResults.length; i++) {
                            if (this.activeSourcesWidget != null) {
                                this.activeSourcesWidget.addQueryLayerControllerEntry(queryResults[i].queryLayerController);
                            }
                        }

                    }
                },
                /**
                 * creates the cluster manager that controls the show/hide of the cluster layer
                 */
                createClusterManager: function () {
                    if (this.resultsClusterManager == null) {
                        if (this.useHeatmap) {
                            this.resultsClusterManager = new ResultsHeatmapManager();
                        }
                        else {
                            this.resultsClusterManager = new ResultsClusterManager();
                        }
                        //see if the layer should be hidden/displayed on creation
                        this.resultsClusterManager.on("clusterLayerCreated", lang.hitch(this, this.checkForClusterLayerVisibility));
                        this.resultsClusterManager.startup();
                    }
                },
                /**
                 * checks the current state of the discovery application ot see if the cluster or footprints layer should be displayed
                 */
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
                /**
                 * creates the footprint manager that handles the show/hide of the footprints layer
                 */
                createFootprintManager: function () {
                    if (this.resultsFootprintManager == null) {
                        this.resultsFootprintManager = new ResultsFootprintManager();
                        //see if the layer should be hidden/displayed on creation
                        this.resultsFootprintManager.on("footprintsLayerCreated", lang.hitch(this, this.checkForFootprintLayerVisibility));
                        this.resultsFootprintManager.startup();
                    }
                },
                /**
                 * checks to see if the footprints layer should be hidden/displayed
                 */
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
                        var transparencyWidget = new SearchLayersTransparencyWidget();
                        this.layerTransparencyTooltip = new TooltipDialog({
                            content: transparencyWidget.domNode
                        });
                        this.layerTransparencyTooltip.on("hide", lang.hitch(this, function () {
                            this.layerTransparencyTooltipVisible = false;
                        }));
                        this.layerTransparencyTooltipVisible = false;
                        topic.subscribe(IMAGERY_GLOBALS.EVENTS.TRANSPARENCY.POPUP.HIDE,
                            lang.hitch(this, this.hideResultLayerTransparencyPopup));
                    }
                    else {
                        this._toggleResultLayerTransparencyPopup();
                    }

                },
                /**
                 * assumes the transparency tooltip already exists
                 * @private
                 */
                _toggleResultLayerTransparencyPopup: function () {
                    if (this.layerTransparencyTooltip) {
                        var params = {
                            popup: this.layerTransparencyTooltip //content of popup is the TootipDialog
                        };
                        if (this.layerTransparencyTooltipVisible) {
                            popup.close(this.layerTransparencyTooltip);
                            this.layerTransparencyTooltipVisible = false;
                        }
                        else {
                            params.around = this.changeResultLayerTransparencyElement;
                            params.orient = ["above"];
                            popup.open(params);
                            this.layerTransparencyTooltipVisible = true;
                        }
                    }
                },
                hideResultLayerTransparencyPopup: function () {
                    if (this.layerTransparencyTooltipVisible && this.layerTransparencyTooltip) {
                        popup.close(this.layerTransparencyTooltip);
                        this.layerTransparencyTooltipVisible = false;
                    }
                }
            });
    });