define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/on",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dijit/form/Button",
    "../../base/grid/ImageryGrid",
    "dojo/_base/array"
],
    function (declare, topic, on, lang, domConstruct, domClass, Button, ImageryGrid, array) {
        return declare(
            [ImageryGrid],
            {
                ignoreVisibleFieldNames: [" ", "zoomToFootprint", "showThumbNail", "addedToCart", "__serviceLabel"],
                constructor: function () {
                },
                initListeners: function () {
                    this.inherited(arguments);
                    //listen for adding result to the shopping cart
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.ADD_TO, lang.hitch(this, this.handleAddResultToCart));
                    //listen for removing item from the cart
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVE_FROM_CART, lang.hitch(this, this.removeItemFromCart));
                    //listen for request of object ids in the cart
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.GET_ADDED_OBJECT_IDS, lang.hitch(this, this.getAddedCartItemIds));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.GET_ADDED_OBJECT_IDS_FOR_QUERY_CONTROLLER, lang.hitch(this, this.getAddedCartItemIdsForQueryController));
                    //returns visible cart field names
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.GET_VISIBLE_FIELD_NAMES, lang.hitch(this, this.getVisibleCartFieldsNames));
                },
                /**
                 * returns visible cart field names to callback
                 * @param callback
                 *
                 */
                getVisibleCartFieldsNames: function (callback) {
                    if (callback == null || !lang.isFunction(callback)) {
                        return;
                    }
                    var visibleColumns = [];
                    var columns = this.grid.columns;
                    if (!lang.isArray(columns)) {
                        var colsAsArray = [];
                        for (var key in columns) {
                            colsAsArray.push(columns[key]);
                        }
                        columns = colsAsArray;
                    }
                    var currentCol;
                    for (var i = 0; i < columns.length; i++) {
                        currentCol = columns[i];
                        if (!this.grid.isColumnHidden(currentCol.id) && array.indexOf(this.ignoreVisibleFieldNames, currentCol.field) < 0) {
                            visibleColumns.push(currentCol.field);
                        }
                    }
                    callback(visibleColumns);
                },
                /**
                 * adds an item to the shopping cart grid
                 * @param item
                 */
                handleAddResultToCart: function (item) {
                    //get to the attributes of the results
                    //add the item to the cart store
                    this.store.add(item);
                },
                /**
                 * removes an item from the shopping cart
                 * @param resultId id of the item to remove
                 */
                removeItemFromCart: function (resultId) {
                    this.store.remove(resultId);
                    this.refresh();
                },
                /**
                 * generates the columns to add to the shopping cart grid
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

                cartRenderHeaderCell: function (node) {
                    var cartDiv = domConstruct.create("div", {
                        title: "Remove all from cart",
                        className: "imageResultsGridCartHeaderIcon commonIcons16 remove"});

                    on(cartDiv, "click", lang.hitch(this, this.handleRemoveAllCartItems));
                    domConstruct.place(cartDiv, node);
                },

                /**
                 * formats the shopping cart column of the shopping cart grid
                 * @param object
                 * @param value
                 * @param node
                 * @param option
                 */

                cartIconFormatter: function (object, value, node, option) {
                    //returns a button for removing item from the cart
                    var cartButton = new Button({iconClass: "resultGridCartIcon commonIcons16 shoppingCartAdded", title: "Remove From Cart"});
                    cartButton.on("click", lang.hitch(this, this.handleRemoveCartItemClick, object));
                    domClass.add(cartButton.domNode, "queryResultShoppingCartButton");
                    domConstruct.place(cartButton.domNode, node);
                },
                /**
                 * fired when the shopping cart column button has been pressed. removes the row from the grid
                 * @param item
                 */
                handleRemoveCartItemClick: function (item) {
                    //handle removing item from the shopping cart
                    if (item.showFootprint) {
                        //hide the footprint since it is visible
                        //   topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.HIDE_FOOTPRINT, item);
                    }
                    var itemId = item[this.storeIdField];
                    this.removeItemFromCart(itemId);
                    //fire event alerting other classes that an item has been removed from the cart
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.REMOVED_FROM_CART, itemId, item);
                    this.setSelectedThumbnails();
                },
                getAddedCartItemIdsForQueryController: function (queryLayerControllerId, callback) {
                    var result = this.getVisibleContentObjectIdArray({queryControllerId: queryLayerControllerId});
                    if (result != null && result.length > 0 && result[0].objectIds != null) {
                        result = result[0].objectIds;

                    }
                    else {
                        result = [];
                    }
                    if (callback != null && lang.isFunction(callback)) {
                        callback(result);
                        return null;
                    }
                    else {
                        return result;
                    }
                },
                /**
                 * returns all item ids for items in the shopping cart
                 * @param callback
                 * @return {*}
                 */
                getAddedCartItemIds: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.getVisibleContentObjectIdArray());
                        return null;
                    }
                    else {
                        return this.getVisibleContentObjectIdArray();
                    }
                },
                handleRemoveAllCartItems: function () {
                    var items = this.store.query();
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            this.handleRemoveCartItemClick(items[i]);
                        }
                    }
                }
            });
    });