define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/store/Observable",
    "dojo/store/Memory",
    "dijit/form/Button",
    "../../base/grid/ImageryGrid"
],
    function (declare, topic, lang, domConstruct, domClass, Observable, Memory, Button, ImageryBaseGrid) {
        return declare(
            [ImageryBaseGrid],
            {
                constructor: function () {
                },
                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.ADD_TO, lang.hitch(this, this.handleAddResultToCart));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVE_FROM_CART, lang.hitch(this, this.removeItemFromCart));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.GET_ADDED_OBJECT_IDS, lang.hitch(this, this.getAddedCartItemIds));
                },
                //handle new results
                handleAddResultToCart: function (item) {
                    //get to the attributes of the results
                    //add the item to the cart store
                    this.store.add(item);
                },
                removeItemFromCart: function (resultId) {
                    this.store.remove(resultId);
                },
                generateManipulationColumns: function () {
                    var parentColumns = this.inherited(arguments);
                    var columns = [
                        {
                            field: "addedToCart",
                            label: " ",
                            sortable: false,
                            renderCell: lang.hitch(this, this.cartIconFormatter),
                            unhidable: true
                        }
                    ];
                    for (var i = 0; i < parentColumns.length; i++) {
                        columns.push(parentColumns[i]);
                    }
                    return columns;
                },
                cartIconFormatter: function (object, value, node, option) {
                    var cartButton = new Button({iconClass: "resultGridCartIcon commonIcons16 shoppingCartAdded", title: "Remove From Cart"});
                    cartButton.on("click", lang.hitch(this, this.handleRemoveCartItemClick, object));
                    domClass.add(cartButton.domNode, "queryResultShoppingCartButton");
                    domConstruct.place(cartButton.domNode, node);
                },
                handleRemoveCartItemClick: function (item) {
                    if (item.showFootprint) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.HIDE_FOOTPRINT, item);
                    }
                    var itemId = item[this.storeIdField];
                    this.removeItemFromCart(itemId);
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.REMOVED_FROM_CART, itemId);
                    this.setSelectedThumbnails();
                },
                getAddedCartItemIds: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.getVisibleContentObjectIdArray());

                    }
                    else{
                        return this.getVisibleContentObjectIdArray();
                    }
                }
            });
});