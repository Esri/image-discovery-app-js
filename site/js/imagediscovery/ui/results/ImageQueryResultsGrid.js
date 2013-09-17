define([
    "dojo/_base/declare",
    "dojo/dom-geometry",
    "dojo/topic",
    "dojo/on",
    "dijit/registry",
    "dojo/query",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/store/Observable",
    "dojo/store/Memory",
    "dijit/form/Button",
    "dijit/form/CheckBox",
    "../base/grid/ImageryGrid",
    "dijit/TooltipDialog",
    "../filter/UserAppliedFiltersManager"

],
    function (declare, domGeometry, topic, on, registry, query, lang, domConstruct, domClass, domStyle, Observable, Memory, Button, CheckBox, ImageryGrid, TooltipDialog, UserAppliedFiltersManager) {
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
                    this.responseFeatures = [];

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
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.COMPLETE, lang.hitch(this, this.handleQueryComplete));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.HIGHLIGHT_RESULTS_FOM_RECTANGLE_INTERSECT, lang.hitch(this, this.highlightResultsFromRectangleIntersect));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.TOGGLE_SHOW_IMAGE, lang.hitch(this, this.handleToggleShowImage));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.TOGGLE_ADD_IMAGE_TO_SHOPPING_CART, lang.hitch(this, this.toggleShoppingCartItem));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR_HIGHLIGHTED_RESULTS, lang.hitch(this, this.clearHighlightedResults));
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
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_DISPLAYED, lang.hitch(this, this.enableThumbnailToggle));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.CLUSTER_LAYER_DISPLAYED, lang.hitch(this, this.disableThumbnailToggle));

                    this.clearQueryResultsHandle = topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.clearGrid));
                    this.setFilterResultsHandle = topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.SET, lang.hitch(this, this.handleApplyFilter));
                    this.itemRemovedFromCartHandle = topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVED_FROM_CART, lang.hitch(this, this.handleItemRemovedFromCart));

                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.ADD_TO,lang.hitch(this, this.handleUpdateToggleAllCartItemsButton));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVE_FROM_CART, lang.hitch(this, this.handleUpdateToggleAllCartItemsButton));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.APPLIED, lang.hitch(this, this.handleUpdateToggleAllCartItemsButton));
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
                 * clears highlighted results in the result grid
                 */
                clearHighlightedResults: function () {
                    var row;
                    var highlightedItems = this.store.query({isHighlighted: true});
                    for (var i = 0; i < highlightedItems.length; i++) {
                        row = this.grid.row(highlightedItems[i]);
                        if (row && row.element) {
                            this.grid.unhighlightYellowRow(row);
                            highlightedItems[i].isHighlighted = false;

                            //remove highlight of footprint
                            topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.UNHIGHLIGHT_FOOTPRINT, highlightedItems[i].OBJECTID);
                        }
                    }
                },
                /**
                 * highlights rows in yellow that are intersecting the passed envelope
                 * @param envelope envelope to test
                 * @param containsFlag flag for contains/intersects
                 */
                highlightResultsFromRectangleIntersect: function (envelope, containsFlag) {
                    var scrolledIntoView = false;
                    var unfilteredResults = this.store.query({isGrayedOut: false, isFiltered: false});
                    var currentVisibleItem;
                    var currentGeometry;
                    var row;
                    var imageInfoAndLayerArray = [];
                    for (var i = 0; i < unfilteredResults.length; i++) {
                        currentVisibleItem = unfilteredResults[i];
                        currentGeometry = currentVisibleItem.geometry;
                        row = this.grid.row(currentVisibleItem);
                        var match;
                        if (containsFlag) {
                            match = envelope.contains(currentGeometry.getExtent());
                        }
                        else {
                            match = envelope.intersects(currentGeometry);
                        }
                        if (match) {
                            if (row && row.element) {
                                this.grid.highlightRowYellow(row);
                                if (!scrolledIntoView) {
                                    var geom = {y: row.element.offsetTop};
                                    this.grid.scrollTo(geom);
                                    scrolledIntoView = true;
                                }
                                currentVisibleItem.isHighlighted = true;

                                //highlight footprint
                                topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.HIGHLIGHT_FOOTPRINT, currentVisibleItem.OBJECTID);

                                //gather image info and associated layer info
                                var queryLayerController = IMAGERY_UTILS.getQueryLayerControllerFromItem(currentVisibleItem);
                                var imageAttrsAndLayer = {imageInfo: currentVisibleItem, layer: queryLayerController.layer};
                                imageInfoAndLayerArray.push(imageAttrsAndLayer);
                            }
                        }
                        else {
                            if (row && row.element && domClass.contains(row.element, "yellowGridRow")) {
                                this.grid.unhighlightYellowRow(row);
                                currentVisibleItem.isHighlighted = false;

                                //remove highlight on footprint
                                topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.UNHIGHLIGHT_FOOTPRINT, currentVisibleItem.OBJECTID);
                            }
                        }
                    }//end for loop

                    //show image info popup
                    topic.publish(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.SET_CONTENT_AND_SHOW, imageInfoAndLayerArray);
                },
                /**
                 * returns visible footprints geometries in the result grid
                 * @param callback function to send the visible footprint geometries to
                 */
                handleGetVisibleFootprintGeometries: function (callback) {
                    var unfilteredResults = this.store.query({isGrayedOut: false, isFiltered: false});
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
                    var unfilteredResults = this.store.query({isGrayedOut: false, isFiltered: false});
                    var features = [];
                    for (var i = 0; i < unfilteredResults.length; i++) {
                        features.push(unfilteredResults[i]);
                    }
                    callback(features);
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
                    this.responseFeatures = [];
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
                            return;
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
                handleQueryComplete: function () {
                    //send the results to the user applied filter manager
                    this.userAppliedFiltersManager.setFeatures(this.responseFeatures);
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
                 * @param results
                 * @param queryLayerController
                 */
                populateQueryResults: function (results, queryLayerController) {
                    if (this.store == null) {
                        this.createNewStore();
                    }
                    this.hideVisibleFilterPopup();
                    //get to the attributes of the results
                    var newItem;
                    var currentAttributes;
                    for (var i = 0; i < results.features.length; i++) {
                        var newItemMixin = {
                            __serviceLabel: queryLayerController.label,
                            queryControllerId: queryLayerController.id,
                            isHighlighted: false,
                            addedToCart: false,
                            geometry: results.features[i].geometry,
                            id: i,
                            isGrayedOut: false,
                            isFiltered: false,
                            showThumbNail: false,
                            showFootprint: false
                        };
                        newItemMixin[this.storeIdField] = VIEWER_UTILS.generateUUID();

                        currentAttributes = results.features[i].attributes;
                        for (var j = 0; j < this.resultFields.length; j++) {
                            if (currentAttributes[this.resultFields[j].field] == null) {
                                currentAttributes[this.resultFields[j].field] = "";
                            }
                        }
                        newItem = lang.mixin(currentAttributes, newItemMixin);
                        this.store.add(newItem);
                    }
                    this.responseFeatures = this.responseFeatures.concat(results.features);
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.RESULT_GRID_POPULATED, results.features.length);
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
                    this.toggleAllCartItemsHeaderIconDiv = domConstruct.create("div", {
                        title: "Add all or remove all from cart",
                        className: "imageResultsGridCartHeaderIcon commonIcons16 shoppingCartEmpty"});

                    on(this.toggleAllCartItemsHeaderIconDiv, "click", lang.hitch(this, this.handleToggleAllCartItems));
                    domConstruct.place(this.toggleAllCartItemsHeaderIconDiv, node);
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
                handleToggleAllCartItems: function() {
                    var addAllItems = false;
                    if (domClass.contains(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartEmpty")) {
                        domClass.remove(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartEmpty");
                        domClass.add(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartAdded");
                        addAllItems = true;
                    }
                    else {
                        domClass.remove(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartAdded");
                        domClass.add(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartEmpty");
                    }

                    var items = this.store.query({ isFiltered: false});
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            var row = this.grid.row(items[i]);
                            var toggleShoppingCartInput = query("input[name=toggleAddToShoppingCart]", row.element);
                            var toggleShoppingCartInputDijit = registry.getEnclosingWidget(toggleShoppingCartInput[0]);
                            if (toggleShoppingCartInputDijit) {
                                if (addAllItems &&
                                    domClass.contains(toggleShoppingCartInputDijit.iconNode, "shoppingCartEmpty")) {
                                    this.addCartItem(items[i], toggleShoppingCartInputDijit);
                                }
                                else if (!addAllItems &&
                                    domClass.contains(toggleShoppingCartInputDijit.iconNode, "shoppingCartAdded")) {
                                    this.removeCartItem(items[i], toggleShoppingCartInputDijit);
                                }
                            }
                        }
                    }
                },
                /**
                 * Determine whether or not need to update the add/remove all cart
                 * items button.
                 */
                handleUpdateToggleAllCartItemsButton: function() {
                    var cartItemIconEmpty = domClass.contains(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartEmpty") ?
                        true : false;
                    var items = this.store.query({ addedToCart: false, isFiltered: false}); //any items not in cart?
                    if (items.length == 0 && cartItemIconEmpty) {
                        //no items NOT in cart => all items in cart
                        domClass.remove(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartEmpty");
                        domClass.add(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartAdded");
                    }
                    else if (items.length > 0 && !cartItemIconEmpty) {
                        //at least one item not in cart
                        domClass.remove(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartAdded");
                        domClass.add(this.toggleAllCartItemsHeaderIconDiv, "shoppingCartEmpty");
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
                    domClass.remove(cartButton.iconNode, "shoppingCartEmpty");
                    domClass.add(cartButton.iconNode, "shoppingCartAdded");
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
                 * clears highlights when the footer containg the results grid has been collapsed
                 */
                handleFooterCollapsed: function () {
                    this.hideVisibleFilterPopup();
                    this.clearHighlightedResults();
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

                }
            });
    });