define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/connect",
    "dojo/on",
    "dijit/registry",
    "dojo/query",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/dom-style",
    "dijit/form/Button",
    "../base/grid/ImageryGrid",
    "dijit/TooltipDialog",
    "../filter/UserAppliedFiltersManager",
    "dgrid/util/mouse"
],
    function (declare, topic, con, on, registry, query, lang, domConstruct, domClass, domStyle, Button, ImageryGrid, TooltipDialog, UserAppliedFiltersManager, mouseUtil) {
        return declare(
            [ImageryGrid],
            {
                constructor: function (params) {
                    this.currentVisibleFilterTooltipObject = null;
                    //lookup for the filter popups to map to the filter icon
                    this.filterPopupLookup = {};
                    //lookup for the filter widgets
                    this.filterWidgetLookup = {};
                    //lookup for the filter icon in the grid header
                    this.filterIconLookup = {};

                    //Need to keep this var at instance level so that
                    //we can update them based on external events
                    this.toggleAllCartItemsHeaderIconDiv = null;

                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.userAppliedFiltersManager = new UserAppliedFiltersManager();
                },
                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IMAGE.TOGGLE_ADD_TO_CART_BY_QUERY_CONTROLLER, lang.hitch(this, this.handleToggleShoppingCartByQueryController));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IMAGE.TOGGLE_IMAGE_BY_QUERY_CONTROLLER, lang.hitch(this, this.handleToggleShowImageByQueryController));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.TOGGLE_SHOW_IMAGE, lang.hitch(this, this.handleToggleShowImage));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.TOGGLE_ADD_IMAGE_TO_SHOPPING_CART, lang.hitch(this, this.toggleShoppingCartItem));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_GRID_RESULT_COUNT, lang.hitch(this, this.handleGetVisibleGridResultCount));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GRAY_OUT_RESULTS_BY_FUNCTION, lang.hitch(this, this.grayOutRowsByFunction));
                    //todo: this needs to be in a manager that keeps count of how many disable requests there are
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.DISABLE_THUMBNAIL_CHECKBOXES, lang.hitch(this, this.disableThumbnailToggle));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.ENABLE_THUMBNAIL_CHECKBOXES, lang.hitch(this, this.enableThumbnailToggle));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR_GRAYED_OUT_RESULTS, lang.hitch(this, this.clearGrayedOutRows));
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.FOOTER.COLLAPSED, lang.hitch(this, this.handleFooterCollapsed));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.ADDED, lang.hitch(this, this.handleFilterAdded));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_FOOTPRINT_GEOMETRIES, lang.hitch(this, this.handleGetVisibleFootprintGeometries));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_FOOTPRINT_FEATURES, lang.hitch(this, this.handleGetVisibleFootprintFeatures));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_FOOTPRINT_FEATURES_GROUPED_BY_QUERY_CONTROLLER, lang.hitch(this, this.handleGetVisibleFootprintFeaturesGroupedByQueryController));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_DISPLAYED, lang.hitch(this, this.enableThumbnailToggle));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.CLUSTER_LAYER_DISPLAYED, lang.hitch(this, this.disableThumbnailToggle));

                    this.clearQueryResultsHandle = topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.clearGrid));
                    this.setFilterResultsHandle = topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.SET, lang.hitch(this, this.handleApplyFilter));
                    this.itemRemovedFromCartHandle = topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVED_FROM_CART, lang.hitch(this, this.handleItemRemovedFromCart));

                },
                loadViewerConfigurationData: function () {
                    this.inherited(arguments);
                    var searchConfiguration = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "searchConfiguration", function (searchConf) {
                        searchConfiguration = searchConf;
                    });
                    if (searchConfiguration != null && lang.isObject(searchConfiguration)) {
                        if (searchConfiguration.allowCheckAllSearchResultThumbnails != null) {
                            this.allowCheckAllThumbnails = searchConfiguration.allowCheckAllSearchResultThumbnails;
                        }
                    }

                },
                startup: function () {
                    this.grid.disablePaginationListener();
                    this.inherited(arguments);
                    this.grid.enablePaginationListener();
                },
                createGrid: function () {
                    this.inherited(arguments);
                    this.grid.on(mouseUtil.enterRow, lang.hitch(this, this.handleRowMouseOver));
                    this.grid.on(mouseUtil.leaveRow, lang.hitch(this, this.handleRowMouseOut));
                    this.grid.on(".dgrid-row:click", lang.hitch(this, this.handleRowClick));
                    con.connect(this.grid, "onPageChanged", lang.hitch(this, this.handleRefreshComplete));

                },
                handleRefreshComplete: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.REFRESH_FOOTPRINTS_LAYER);
                },

                handleRowClick: function (evt) {
                    if (domClass.contains(evt.target, "dgrid-cell")) {
                        var row = this.grid.row(evt);
                        if (row != null && row.data != null && row.data.geometry && lang.isFunction(row.data.geometry.getCentroid)) {
                            var centroid = row.data.geometry.getCentroid();
                            topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.PAN_TO, centroid);
                            var extentHandle = topic.subscribe(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.CHANGED, function () {
                                topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.SHOW_POPUP_FROM_MAP_COORDINATES, row.data, centroid);
                                var queryController = IMAGERY_UTILS.getQueryLayerControllerFromItem(row.data);
                                if (queryController != null) {
                                    queryController.showThumbnail(row.data);
                                }
                                extentHandle.remove();
                            });

                        }
                    }
                },
                handleRowMouseOver: function (evt) {
                    var row = this.grid.row(evt);
                    if (row != null && row.data != null && row.element != null) {
                        domClass.add(row.element, "imageQueryResultHoverItem");
                        var queryController = IMAGERY_UTILS.getQueryLayerControllerFromItem(row.data);
                        if (queryController != null) {
                            queryController.showThumbnail(row.data);
                        }
                    }

                },
                handleRowMouseOut: function (evt) {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.CLEAR);


                    var row = this.grid.row(evt);
                    if (row != null && row.element != null) {
                        domClass.remove(row.element, "imageQueryResultHoverItem");

                    }
                },
                /**
                 *
                 * listener for IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_GRID_RESULT_COUNT
                 * returns the count of visible results in the grid
                 * @param callback
                 */
                handleGetVisibleGridResultCount: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        var unfilteredResults = this.store.query({isGrayedOut: false, isFiltered: false});
                        callback(unfilteredResults.length);
                    }
                },
                /**
                 * returns visible footprints geometries in the result grid
                 * @param callback function to send the visible footprint geometries to
                 */
                handleGetVisibleFootprintGeometries: function (callback) {
                    var count = this.grid.rowsPerPage;
                    var start = (this.grid._currentPage - 1) * count;
                    var unfilteredResults = this.store.query({isGrayedOut: false, isFiltered: false}, {sort: this.grid._sort, count: count, start: start});
                    var geometries = [];
                    for (var i = 0; i < unfilteredResults.length; i++) {
                        geometries.push(unfilteredResults[i].geometry);
                    }
                    callback(geometries);
                },
                /**
                 * returns visible footprint features in the result grid
                 * @param callback  function to send the visible footprint features to
                 */
                handleGetVisibleFootprintFeatures: function (callback) {
                    if (callback == null || !lang.isFunction(callback)) {
                        return;
                    }
                    var count = this.grid.rowsPerPage;
                    var start = (this.grid._currentPage - 1) * count;
                    var unfilteredResults = this.store.query({isGrayedOut: false, isFiltered: false}, {sort: this.grid._sort, count: count, start: start});
                    var features = [];
                    for (var i = 0; i < unfilteredResults.length; i++) {
                        features.push(unfilteredResults[i]);
                    }
                    callback(features);

                },
                handleGetVisibleFootprintFeaturesGroupedByQueryController: function (callback) {
                    var resultsByQueryControllerId = {};
                    if (callback == null || !lang.isFunction(callback)) {
                        return;
                    }
                    var visibleFeatures;
                    this.handleGetVisibleFootprintFeatures(function (results) {
                        visibleFeatures = results;
                    });
                    if (visibleFeatures) {
                        for (var i = 0; i < visibleFeatures.length; i++) {
                            var addArr;
                            if (resultsByQueryControllerId[visibleFeatures[i].queryControllerId] == null) {
                                addArr = [];
                                resultsByQueryControllerId[visibleFeatures[i].queryControllerId] = addArr;
                            }
                            else {
                                addArr = resultsByQueryControllerId[visibleFeatures[i].queryControllerId];
                            }
                            addArr.push(visibleFeatures[i]);
                        }
                    }
                    callback(resultsByQueryControllerId);
                },

                handleToggleShowImageByQueryController: function (queryLayerController, feature) {
                    if (queryLayerController == null || feature == null) {
                        return;
                    }
                    var attributes = (feature.attributes != null && lang.isObject(feature.attributes)) ? feature.attributes : feature;
                    var objectIdField = queryLayerController.layer.objectIdField;
                    var objectId = attributes[objectIdField];
                    if (objectId != null) {
                        var queryParams = {queryControllerId: queryLayerController.id};
                        queryParams[objectIdField] = objectId;
                        var items = this.store.query(queryParams);
                        if (items.length > 0) {
                            this.handleToggleShowImage(items[0]);
                        }
                    }
                },
                /**
                 * toggles the thumbnail checkbox for the passed grid item
                 * @param gridItem
                 */
                handleToggleShowImage: function (gridItem) {
                    //find the row and check or uncheck the checkbox and that will trigger the image to be shown
                    var row = this.grid.row(gridItem);
                    var showThumbnailInput = query("input[name=showThumbNail]", row.element);
                    var currentCheckDijit = registry.getEnclosingWidget(showThumbnailInput[0]);
                    if (currentCheckDijit) {
                        if (currentCheckDijit.checked) {
                            currentCheckDijit.set("checked", false);
                        }
                        else {
                            currentCheckDijit.set("checked", true);
                        }
                    }
                },
                handleToggleShoppingCartByQueryController: function (queryLayerController, feature) {
                    if (queryLayerController == null || feature == null) {
                        return;
                    }
                    var attributes = (feature.attributes != null && lang.isObject(feature.attributes)) ? feature.attributes : feature;
                    var objectIdField = queryLayerController.layer.objectIdField;
                    var objectId = attributes[objectIdField];
                    if (objectId != null) {
                        var queryParams = {queryControllerId: queryLayerController.id};
                        queryParams[objectIdField] = objectId;
                        var items = this.store.query(queryParams);
                        if (items.length > 0) {
                            this.toggleShoppingCartItem(items[0]);
                        }
                    }
                },
                /**
                 * toggle the shopping cart button for the passed item
                 * @param gridItem
                 */
                toggleShoppingCartItem: function (gridItem) {
                    var row = this.grid.row(gridItem);
                    var toggleShoppingCartInput = query("input[name=toggleAddToShoppingCart]", row.element);
                    var toggleShoppingCartInputDijit = registry.getEnclosingWidget(toggleShoppingCartInput[0]);
                    if (toggleShoppingCartInputDijit) {
                        this.handleToggleCartItem(gridItem, toggleShoppingCartInputDijit);
                    }
                },
                /**
                 * called when a filter has been added to the discovery viewer
                 * @param filterWidget
                 */
                handleFilterAdded: function (filterWidget) {
                    this.filterWidgetLookup[filterWidget.queryField] = filterWidget;
                    //bind filter to the filter icon
                    filterWidget.on("clearFilterFunction", lang.hitch(this, this.handleSetFilterIconCleared, filterWidget.queryField));
                    filterWidget.on("applyFilterFunction", lang.hitch(this, this.handleSetFilterIconApplied, filterWidget.queryField));
                    filterWidget.on("filterHidden", lang.hitch(this, this.handleHideFilterIcon, filterWidget.queryField));
                    filterWidget.on("filterDisplayed", lang.hitch(this, this.handleShowFilterIcon, filterWidget.queryField));
                },
                /**
                 * clears the result grid
                 */
                clearGrid: function () {
                    this.inherited(arguments);
                    this.hideAllFilterIcons();
                    this.onHideFilterResetIcon();
                    if (this.toggleAllCartItemsHeaderIconDiv) {
                        if (domClass.contains(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartAdded")) {
                            domClass.remove(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartAdded");
                            domClass.add(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartEmpty");
                        }
                    }
                },
                /**
                 * grays out result grid rows by the passed functon
                 * @param isDisabledFunction function that takes in an item and returns true if the item row should be grayed out
                 */
                grayOutRowsByFunction: function (isDisabledFunction) {
                    this.inherited(arguments);
                    //need to hide the filters
                    var currentFilterIcon;
                    for (var key in this.filterIconLookup) {
                        var filterIconForWidget = this.filterIconLookup[key];
                        if (domStyle.get(filterIconForWidget.parentNode, "display") === "block") {
                            domClass.add(filterIconForWidget, "tempDisabledFilterIcon");
                            this.handleHideFilterIcon(key);
                        }
                    }
                    this.onHideFilterResetIcon();
                },
                /**
                 * clears all grayed out rows in the result grid
                 */
                clearGrayedOutRows: function () {
                    this.inherited(arguments);
                    //show the filters again
                    for (var key in this.filterIconLookup) {
                        var filterIconForWidget = this.filterIconLookup[key];
                        if (domClass.contains(filterIconForWidget, "tempDisabledFilterIcon")) {
                            domClass.remove(filterIconForWidget, "tempDisabledFilterIcon");
                            this.handleShowFilterIcon(key);
                        }
                    }
                    this.onShowFilterResetIcon();
                },
                /**
                 *  takes in a filter function. and applies filter function to each item
                 * @param filterFunction
                 */
                handleApplyFilter: function (filterFunction) {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.BEFORE_APPLY);
                    var filterFunctionInner = function (item) {
                        var match = filterFunction(item);
                        var queryLayerController = IMAGERY_UTILS.getQueryLayerControllerFromItem(item);
                        if (queryLayerController == null) {
                            return null;
                        }
                        item.isFiltered = !match;
                        return match;
                    };
                    this.grid.set("query", filterFunctionInner);
                    this.setSelectedThumbnails();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.APPLIED);
                    this.reHighlightRows();
                },
                /**
                 * i have no idea what this function does
                 */
                reHighlightRows: function () {
                    var scrolledIntoView = false;
                    var unfilteredResults = this.store.query({isHighlighted: true});
                    var currentVisibleItem;
                    var row;

                    for (var i = 0; i < unfilteredResults.length; i++) {
                        currentVisibleItem = unfilteredResults[i];
                        row = this.grid.row(currentVisibleItem);
                        if (row && row.element) {
                            this.grid.highlightRowYellow(row);
                            if (!scrolledIntoView) {
                                var geom = {y: row.element.offsetTop};
                                this.grid.scrollTo(geom);
                                scrolledIntoView = true;
                            }
                        }
                    }
                },
                /**
                 * called when a query in the discovery application is complete
                 */

                _handleQueryComplete: function () {
                    //send the results to the user applied filter manager
                    this.userAppliedFiltersManager.initializeFilterRanges();
                    this.onShowFilterResetIcon();

                    //check to see if the footprints layer is visible. if it's not disable thumbnail toggle
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_VISIBLE, lang.hitch(this, function (visible) {
                        if (visible) {
                            this.enableThumbnailToggle();
                        }
                        else {
                            this.disableThumbnailToggle();
                        }
                    }));
                },
                /**
                 * adds query results to the result grid
                 * @param queryResults
                 */
                populateQueryResults: function (queryResults) {
                    this.grid.disablePaginationListener();
                    this.hideVisibleFilterPopup();
                    //get to the attributes of the results
                    var data = [];
                    for (var i = 0; i < queryResults.length; i++) {
                        var results = queryResults[i].response;
                        var queryLayerController = queryResults[i].queryLayerController;
                        if (results == null || queryLayerController == null) {
                            continue;
                        }
                        var newItem;
                        var currentAttributes;
                        //todo: need to make all of these added fields private so the column doesn't override
                        for (var j = 0; j < results.features.length; j++) {
                            var newItemMixin = {
                                __serviceLabel: queryLayerController.label,
                                queryControllerId: queryLayerController.id,
                                isHighlighted: false,
                                addedToCart: false,
                                geometry: results.features[j].geometry,
                                id: j,
                                isGrayedOut: false,
                                isFiltered: false,
                                showThumbNail: false,
                                showFootprint: false
                            };
                            newItemMixin[this.storeIdField] = VIEWER_UTILS.generateUUID();
                            currentAttributes = results.features[j].attributes;

                            if (queryLayerController.serviceConfiguration && queryLayerController.serviceConfiguration.fieldMapping != null && lang.isObject(queryLayerController.serviceConfiguration.fieldMapping)) {
                                //perform field mappings on the result
                                var fieldMappings = queryLayerController.serviceConfiguration.fieldMapping;
                                for (var key in fieldMappings) {
                                    var mappingValue = fieldMappings[key];
                                    if (currentAttributes[key] == null) {
                                        currentAttributes[mappingValue] = "";
                                    }
                                    else {
                                        currentAttributes[mappingValue] = currentAttributes[key];
                                        delete currentAttributes[key];
                                    }
                                }
                            }
                            for (var k = 0; k < this.resultFields.length; k++) {
                                if (currentAttributes[this.resultFields[k].field] == null) {
                                    currentAttributes[this.resultFields[k].field] = "";
                                }
                            }
                            data.push(lang.mixin(currentAttributes, newItemMixin));
                        }
                    }
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.RESULT_GRID_POPULATED, results.features.length);
                    this.grid.enablePaginationListener();

                    this.createNewGridStoreFromData(data);

                    this._handleQueryComplete();
                },
                /**
                 * generates the manipulation columns for the result grid
                 * @return {Array}
                 */
                generateManipulationColumns: function () {
                    var parentColumns = this.inherited(arguments);
                    var columns = [
                        {
                            field: "addedToCart",
                            label: " ",
                            sortable: false,
                            renderCell: lang.hitch(this, this.cartIconFormatter),
                            renderHeaderCell: lang.hitch(this, this.cartRenderHeaderCell),
                            unhidable: true
                        }

                    ];
                    for (var i = 0; i < parentColumns.length; i++) {
                        columns.push(parentColumns[i]);
                    }
                    return columns;
                },
                /**
                 * generates the layer columns for the result grid
                 * @return {*}
                 */
                generateLayerColumns: function () {
                    var layerColumns = this.inherited(arguments);

                    var i;
                    var currentFilterConfig;
                    var filteredColumns = {};
                    var currentResultField;
                    //find all the filtered fields
                    for (i = 0; i < this.resultFields.length; i++) {
                        currentResultField = this.resultFields[i];
                        if (currentResultField.filter && currentResultField.filter.enable) {
                            filteredColumns[currentResultField.field] = currentResultField.filter;
                        }
                    }
                    //set the header renderer for the filter fields
                    var currentColumn;
                    for (i = 0; i < layerColumns.length; i++) {
                        currentColumn = layerColumns[i];
                        if (filteredColumns[currentColumn.field] != null) {
                            currentColumn.renderHeaderCell = lang.hitch(this, this.renderFilterHeaderColumn, currentColumn)
                        }
                    }
                    return layerColumns;
                },
                cartRenderHeaderCell: function (node) {
                    /*
                     this.toggleAllCartItemsHeaderIconDiv = domConstruct.create("div", {
                     title: "Add all items on page",
                     className: "imageResultsGridCartHeaderIcon commonIcons16 add"});

                     on(this.toggleAllCartItemsHeaderIconDiv, "click", lang.hitch(this, this.handleAddAllItemsToCart));
                     domConstruct.place(this.toggleAllCartItemsHeaderIconDiv, node);
                     */
                },

                /**
                 * formatter function for the cart column
                 *
                 * @param object
                 * @param value
                 * @param node
                 * @param option
                 */
                cartIconFormatter: function (object, value, node, option) {
                    var iconClass = !value ? "resultGridCartIcon commonIcons16 shoppingCartEmpty" : "resultGridCartIcon  commonIcons16 shoppingCartAdded";
                    var title = !value ? "Add To Cart" : "Remove From Cart";
                    var cartButton = new Button({iconClass: iconClass, title: title, name: "toggleAddToShoppingCart"});
                    cartButton.on("click", lang.hitch(this, this.handleToggleCartItem, object, cartButton));
                    domClass.add(cartButton.domNode, "queryResultShoppingCartButton");
                    domConstruct.place(cartButton.domNode, node);
                },
                /**
                 * Either adds or removes all items to/from shopping cart.
                 * @param cartHeaderCheckbox
                 * @param cartIconDiv
                 */
                handleAddAllItemsToCart: function () {
                    var count = this.grid.rowsPerPage;
                    var start = (this.grid._currentPage - 1) * count;
                    var items = this.store.query({ isFiltered: false, addedToCart: false}, {sort: this.grid._sort, count: count, start: start});
                    for (var i = 0; i < items.length; i++) {
                        var row = this.grid.row(items[i]);
                        var toggleShoppingCartInput = query("input[name=toggleAddToShoppingCart]", row.element);
                        if (toggleShoppingCartInput != null && toggleShoppingCartInput.length > 0) {
                            var toggleShoppingCartInputDijit = registry.getEnclosingWidget(toggleShoppingCartInput[0]);
                            if (toggleShoppingCartInputDijit) {
                                if (domClass.contains(toggleShoppingCartInputDijit.iconNode, "shoppingCartEmpty")) {
                                    this.addCartItem(items[i], toggleShoppingCartInputDijit);
                                }
                            }
                        }
                    }
                },

                /**
                 * toggles the passed cart row entry
                 * @param entry
                 * @param cartButton
                 * @param e
                 */
                handleToggleCartItem: function (entry, cartButton, e) {
                    if (domClass.contains(cartButton.iconNode, "shoppingCartEmpty")) {
                        this.addCartItem(entry, cartButton);
                    }
                    else {
                        this.removeCartItem(entry, cartButton, true);
                    }
                },
                /**
                 * adds a result item entry to the shopping cart grid
                 * @param entry
                 * @param cartButton
                 */
                addCartItem: function (entry, cartButton) {
                    if (cartButton) {
                        domClass.remove(cartButton.iconNode, "shoppingCartEmpty");
                        domClass.add(cartButton.iconNode, "shoppingCartAdded");
                    }
                    entry.addedToCart = true;
                    var clonedCartItem = lang.clone(entry);
                    //show the thumbnail by default
                    clonedCartItem.showThumbNail = true;
                    //    clonedCartItem.showFootprint = false;
                    clonedCartItem.isFiltered = false;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.ADD_TO, clonedCartItem);
                },
                /**
                 * removes a result item entry from the shopping cart grid
                 * @param entry
                 * @param cartButton
                 * @param fireRemoveEvent
                 */
                removeCartItem: function (entry, cartButton, fireRemoveEvent) {
                    if (fireRemoveEvent == null) {
                        fireRemoveEvent = true;
                    }
                    entry.addedToCart = false;
                    if (cartButton) {
                        this._removeAddedToCartIcon(cartButton);
                    }
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.REMOVE_FROM_CART, entry[this.storeIdField], entry);


                },
                _removeAddedToCartIcon: function (cartButton) {
                    domClass.add(cartButton.iconNode, "shoppingCartEmpty");
                    domClass.remove(cartButton.iconNode, "shoppingCartAdded");
                },
                /**
                 * called when an item has been removed from the shopping cart grid
                 * @param resultId
                 */
                handleItemRemovedFromCart: function (resultId) {
                    var item = this.store.get(resultId);
                    if (item == null) {
                        return;
                    }
                    var row = this.grid.row(item);
                    if (row) {
                        if (row.element) {
                            var cartButton = query(".queryResultShoppingCartButton", row.element);
                            if (cartButton.length > 0) {
                                var cartButtonDijit = registry.getEnclosingWidget(cartButton[0]);
                                if (cartButtonDijit) {
                                    this.removeCartItem(item, cartButtonDijit, false);
                                    return;
                                }
                            }
                        }
                        this.removeCartItem(item, null, false);
                    }
                },
                destroy: function () {
                    if (this.clearQueryResultsHandle) {
                        this.clearQueryResultsHandle.remove();
                        this.clearQueryResultsHandle = null;
                    }
                    if (this.setFilterResultsHandle) {
                        this.setFilterResultsHandle.remove();
                        this.setFilterResultsHandle = null;
                    }
                    if (this.itemRemovedFromCartHandle) {
                        this.itemRemovedFromCartHandle.remove();
                        this.itemRemovedFromCartHandle = null;
                    }
                    this.inherited(arguments);
                },
                renderFilterHeaderColumn: function (currentColumn, node) {
                    var headerLabel = domConstruct.create("span", {className: "resultsGridFilterHeaderLabel", innerHTML: currentColumn.label});
                    var fitlerIconWrapper = domConstruct.create("div", {className: "queryFilterIconWrapper"});
                    var filterIcon = domConstruct.create("div", {className: "commonIcons16 filter filterHidden resultsGridFilterHeaderIcon"});
                    domConstruct.place(filterIcon, fitlerIconWrapper);
                    on(fitlerIconWrapper, "click", lang.hitch(this, this.handleFilterHeaderPopupToggle, currentColumn.field, filterIcon));
                    domConstruct.place(headerLabel, node);
                    domConstruct.place(fitlerIconWrapper, node);
                    this.filterIconLookup[currentColumn.field] = filterIcon;
                    this.handleHideFilterIcon(currentColumn.field);

                },
                /**
                 * toggles grid filter by field name and filter icon element
                 * @param fieldName
                 * @param filterIcon
                 * @param e
                 */
                handleFilterHeaderPopupToggle: function (fieldName, filterIcon, e) {
                    //don't want to sort
                    e.stopPropagation();
                    if (domClass.contains(filterIcon, "filterHidden")) {

                        this.showFilterPopup(fieldName, filterIcon);
                    }
                    else {
                        this.hideFilterPopup(this.filterPopupLookup[fieldName], filterIcon);
                    }
                },
                hideFilterPopup: function (filterPopup, filterIcon) {
                    if (filterPopup) {
                        domClass.remove(filterIcon, "filterVisible");
                        domClass.add(filterIcon, "filterHidden");
                        dijit.popup.close(filterPopup);

                        //can only have one visible popup
                        this.currentVisibleFilterTooltipObject = null;
                    }
                },
                /**
                 * shows filter popup for field name and filter icon
                 * @param fieldName
                 * @param filterIcon
                 */
                showFilterPopup: function (fieldName, filterIcon) {
                    domClass.remove(filterIcon, "filterHidden");
                    domClass.add(filterIcon, "filterVisible");
                    if (this.filterPopupLookup[fieldName] == null) {
                        //create the filter tooltip
                        var filterWidget = this.filterWidgetLookup[fieldName];
                        var filterPopupContentWrapper = domConstruct.create("div", {className: "queryFilterPopupContent"});

                        var filterPopupHeaderContent = domConstruct.create("div", {className: "queryFilterPopupContentHeader"});
                        var closeButton = domConstruct.create("div", {title: "Close", className: "filterWidgetPopupCloseIcon windowAction close"});
                        var resetButton = domConstruct.create("div", {title: "Reset Filter", className: "filterWidgetRevertIcon commonIcons16 revertGray"});

                        domConstruct.place(resetButton, filterPopupHeaderContent);
                        domConstruct.place(closeButton, filterPopupHeaderContent);
                        domConstruct.place(filterPopupHeaderContent, filterPopupContentWrapper);
                        domConstruct.place(filterWidget.domNode, filterPopupContentWrapper);

                        var tooltip = new TooltipDialog({ content: filterPopupContentWrapper });
                        this.filterPopupLookup[fieldName] = tooltip;

                        //listen for close
                        on(closeButton, "click", lang.hitch(this, this.hideFilterPopup, tooltip, filterIcon));
                        on(resetButton, "click", lang.hitch(filterWidget, filterWidget.reset));
                    }
                    var filterTooltip = this.filterPopupLookup[fieldName];
                    if (filterTooltip) {
                        dijit.popup.open({
                            popup: filterTooltip,
                            around: filterIcon,
                            orient: ["above"]
                        });
                        //can only have one visible popup
                        this.currentVisibleFilterTooltipObject = {tooltip: filterTooltip, filterIcon: filterIcon};
                    }
                },
                /**
                 * hides all filter icons in the result grid
                 */
                hideAllFilterIcons: function () {
                    for (var key in this.filterIconLookup) {
                        this.handleHideFilterIcon(key);
                    }
                },
                /**
                 * hides filter icon by the passed field name
                 * @param queryField
                 */
                handleHideFilterIcon: function (queryField) {
                    var filterIconForWidget = this.filterIconLookup[queryField];
                    //need to hide the icon wrapper
                    domStyle.set(filterIconForWidget.parentNode, "display", "none");
                },
                /**
                 * shows filter icon by the passed field name
                 * @param queryField
                 */
                handleShowFilterIcon: function (queryField) {
                    var filterIconForWidget = this.filterIconLookup[queryField];
                    //need to show the icon wrapper
                    domStyle.set(filterIconForWidget.parentNode, "display", "block");
                },
                /**
                 * clears yellow highlight for filter icon based on query field
                 * @param queryField
                 */
                handleSetFilterIconCleared: function (queryField) {
                    var filterIconForWidget = this.filterIconLookup[queryField];
                    domClass.remove(filterIconForWidget, "filterHighlight");
                    domClass.add(filterIconForWidget, "filter");
                },
                /**
                 * highlights filter icon yellow for passed query field
                 * @param queryField
                 */
                handleSetFilterIconApplied: function (queryField) {
                    var filterIconForWidget = this.filterIconLookup[queryField];
                    domClass.remove(filterIconForWidget, "filter");
                    domClass.add(filterIconForWidget, "filterHighlight");
                },
                /**
                 * clears highlights when the footer contains the results grid has been collapsed
                 */
                handleFooterCollapsed: function () {
                    this.hideVisibleFilterPopup();
                },
                /**
                 * hides the current visible filter popup
                 *
                 */
                hideVisibleFilterPopup: function () {
                    if (this.currentVisibleFilterTooltipObject != null && lang.isObject(this.currentVisibleFilterTooltipObject)) {
                        this.hideFilterPopup(this.currentVisibleFilterTooltipObject.tooltip, this.currentVisibleFilterTooltipObject.filterIcon);
                    }
                },
                /**
                 * returns the count of visible items in the result grid
                 * @return {*}
                 */
                getVisibleItemCount: function () {
                    var items = this.store.query({isFiltered: false});
                    return items.length;
                },
                /**
                 * passing this a query object will return the result of the query store
                 * @param queryParams
                 * @return {*}
                 */
                queryResultSet: function (queryParams) {
                    return this.store.query(queryParams);
                },
                /**
                 * resets all filters associated with the result grid
                 */
                resetAllFilters: function () {
                    this.userAppliedFiltersManager.resetFilters();
                },
                onHideFilterResetIcon: function () {

                },
                onShowFilterResetIcon: function () {

                },
                //handles zoom to result request
                handleZoomToResult: function (entry, e) {
                    var extentHandle = topic.subscribe(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.CHANGED, function () {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.RELOAD);
                        extentHandle.remove();
                    });
                    this.inherited(arguments);
                }

            });
    })
;