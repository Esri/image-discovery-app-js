define([
    "dojo/_base/declare",
    "dojo/text!./template/MapIdentifyPopupWidgetTemplate.html",
    "xstyle/css!./theme/MapIdentifyPopupWidgetTheme.css",
    "dojo/topic",
    "dojo/date/locale",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/_base/array",
    "esriviewer/ui/base/UITemplatedWidget",
    "dojo/on"
],
    function (declare, template, cssTheme, topic, locale, lang, domConstruct, domStyle, domClass, array, UITemplatedWidget, on) {
        return declare(
            [UITemplatedWidget],
            {
                __defaultFloatPrecision: 3,
                __defaultDateFormat: "dd-MM-yyyy",
                defaultHideFields: {
                    __serviceLabel: "__serviceLabel",
                    queryControllerId: "queryControllerId",
                    isHighlighted: "isHighlighted",
                    isGrayedOut: "isGrayedOut",
                    SrcImgID: "SrcImgID",
                    Category: "Category",
                    id: "id",
                    geometry: "geometry",
                    _storeId: "_storeId",
                    isFiltered: "isFiltered",
                    addedToCart: "addedToCart",
                    showThumbNail: "showThumbNail",
                    showFootprint: "showFootprint",
                    OBJECTID: "OBJECTID",
                    Shape_Area: "Shape_Area",
                    Shape_Length: "Shape_Length",
                    SHAPE_Area: "SHAPE_Area",
                    SHAPE_Length: "SHAPE_Length"
                },
                currentIdentifyId: null,
                currentIdentifyResultCount: 0,
                templateString: template,
                constructor: function () {
                    this.featureToCartIconLookup = {};
                    this.displayFieldsLookup = {};
                },
                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.ADD_TO, lang.hitch(this, this.handleAddItemToCart));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IDENTIFY.ADD_RESULT, lang.hitch(this, this.handleAddIdentifyResult));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVE_FROM_CART, lang.hitch(this, this.handleItemRemovedFromCart));
                    //when user removes item from cart from ShoppingCart view
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVED_FROM_CART, lang.hitch(this, this.handleItemRemovedFromCart));
                },
                loadViewerConfigurationData: function () {
                    var displayFieldsLookup;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_DISPLAY_FIELDS_LOOKUP, function (dispFieldsLookup) {
                        displayFieldsLookup = dispFieldsLookup;
                    });
                    if (displayFieldsLookup != null && lang.isObject(displayFieldsLookup)) {
                        this.displayFieldsLookup = displayFieldsLookup;
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
                    var popupConfig = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "popupConfiguration", function (popupConf) {
                        popupConfig = popupConf;
                    });
                    if (popupConfig != null && lang.isObject(popupConfig)) {
                        if (popupConfig.displayFields != null && lang.isArray(popupConfig.displayFields)) {
                            this.popupDisplayFields = popupConfig.displayFields;
                        }
                    }
                },
                startIdentify: function (id) {
                    this.currentIdentifyId = id;
                },
                handleAddIdentifyResult: function (identifyResult) {
                    if (identifyResult.identifyId != this.currentIdentifyId) {
                        return;
                    }
                    // var html = this._generateResultHTML(identifyResult, this.currentIdentifyResultCount == 0);
                    var addedCartItemIds;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.GET_ADDED_OBJECT_IDS_FOR_QUERY_CONTROLLER, identifyResult.queryLayerController.id, function (res) {
                        addedCartItemIds = res;
                    });
                    var html = this._generateResultHTML(identifyResult, addedCartItemIds, true);
                    domConstruct.place(html, this.mapIdentifyResults);
                    if (this.currentIdentifyResultCount == 0) {
                        this.onShow();
                    }
                    this.currentIdentifyResultCount++;


                },
                clear: function () {
                    domConstruct.empty(this.mapIdentifyResults);
                    this.featureToCartIconLookup = {};
                    this.currentIdentifyId = null;
                    this.currentIdentifyResultCount = 0;
                },
                getFormattedDate: function (value) {
                    try {
                        var date = new Date(value);
                        var formatter = (this.displayFormats != null && this.displayFormats.date != null) ? this.displayFormats.date : this.__defaultDateFormat;
                        return locale.format(date, {selector: "date", datePattern: formatter});
                    }
                    catch (err) {
                        return null;
                    }
                },
                _generateResultHTML: function (response, addedCartItemIds, expanded) {
                    var fieldTypeLookup = IMAGERY_UTILS.getFieldTypeLookup(response.queryLayerController);
                    var resultNode = domConstruct.create("div");
                    var resultEntries = domConstruct.create("div", {style: {display: (expanded ? "block" : "none")}});
                    var header = domConstruct.create("div", {className: "windowHeader mapIdentifyResultHeader threePixelBorderRadius"});
                    var headerLbl = domConstruct.create("span", { innerHTML: response.queryLayerController.label});
                    var toggleIcon = "up";
                    if (expanded) {
                        toggleIcon = "down";
                    }
                    var headerToggler = domConstruct.create("div", { className: "commonIcons16 mapIdentifyResultToggler " + toggleIcon});
                    on(header, "click", lang.hitch(this, this._toggleResultContent, headerToggler, resultEntries));
                    domConstruct.place(headerLbl, header);
                    domConstruct.place(headerToggler, header);
                    domConstruct.place(header, resultNode);
                    domConstruct.place(resultEntries, resultNode);
                    var currentFeature;
                    var fieldAliasLookup = response.queryLayerController.serviceConfiguration.fieldMapping;
                    if (fieldAliasLookup == null) {
                        fieldAliasLookup = {};
                    }
                    var cartItemLookup = this.featureToCartIconLookup[response.queryLayerController.id];
                    if (cartItemLookup == null) {
                        cartItemLookup = {};
                        this.featureToCartIconLookup[response.queryLayerController.id] = cartItemLookup;
                    }
                    for (var i = 0; i < response.features.length; i++) {
                        var featureId = response.features[i].attributes[response.queryLayerController.layer.objectIdField];
                        var inCart = array.indexOf(addedCartItemIds, featureId) > -1;
                        currentFeature = response.features[i];
                        var featureMarkup = this._generateFeatureMarkup(currentFeature, inCart, fieldTypeLookup, fieldAliasLookup, response.queryLayerController);
                        cartItemLookup[featureId] = featureMarkup.cartIcon;
                        domConstruct.place(featureMarkup.container, resultEntries);
                    }
                    return resultNode;
                },
                _generateFeatureMarkup: function (feature, inCart, fieldTypeLookup, fieldAliasLookup, queryLayerController) {
                    var attributes = feature.attributes;
                    var featureContainer = domConstruct.create("div");
                    var actionsContainer = domConstruct.create("div", {className: "imagePopupActionsContainer"});

                    domConstruct.place(actionsContainer, featureContainer);

                             /*
                    if (queryLayerController.supportsThumbnail()) {
                        var showThumb = domConstruct.create("div", {className: "commonIcons16 binoculars"});
                        on(showThumb, "mouseover", lang.hitch(this, this.handleLayerMouseOver,feature,queryLayerController));
                        on(showThumb, "mouseout", lang.hitch(this, this.handleLayerMouseOut));
                        domConstruct.place(showThumb, actionsContainer);
                    }
                    */

                    var toggleImage = domConstruct.create("div", {className: "showImageHeaderIcon", title: "Toggle Image"});
                    on(toggleImage, "click", lang.hitch(this, this.handleToggleShowImage, queryLayerController, feature));
                    domConstruct.place(toggleImage, actionsContainer);


                    //shoppingCartAdded
                    var cartClass = inCart ? "shoppingCartAdded" : "shoppingCartEmpty";
                    var toggleCart = domConstruct.create("div", {className: "commonIcons16 shoppingCartHeaderIcon " + cartClass, title: "Toggle Cart", style: {marginRight: "10px"}});
                    on(toggleCart, "click", lang.hitch(this, this.handleToggleToCart, queryLayerController, feature));
                    domConstruct.place(toggleCart, actionsContainer);


                    var featureUL = domConstruct.create("ul", {className: "imagePopupFeature"});
                    domConstruct.place(featureUL, featureContainer);
                    for (var key in attributes) {
                        if (this.defaultHideFields[key] != null) {
                            //make sure the field isn't in the configuration popup fields
                            continue;
                        }
                        var featureLiEntry = domConstruct.create("li", {className: "imagePopupEntry"});
                        var configuredFieldName = fieldAliasLookup[key] == null ? key : fieldAliasLookup[key];
                        var displayFieldName = this.displayFieldsLookup[configuredFieldName] == null ? configuredFieldName : this.displayFieldsLookup[configuredFieldName];
                        var featureEntryLbl = domConstruct.create("span", {className: "imagePopupLabel", innerHTML: displayFieldName + ": "});
                        var displayValue;
                        if (attributes[key] == null || attributes[key] === "") {
                            displayValue = "*Empty*";
                        }
                        else {
                            //check if we need to format an attribute entry
                            if (fieldTypeLookup.dateLookup[configuredFieldName] != null) {
                                displayValue = this.getFormattedDate(attributes[key]);

                            }
                            else if (fieldTypeLookup.doubleLookup[configuredFieldName] != null) {
                                if (this.displayFormats && this.displayFormats.floatPrecision != null) {
                                    displayValue = parseFloat(attributes[key].toFixed(this.displayFormats.floatPrecision));
                                }
                                else {
                                    displayValue = parseFloat(attributes[key].toFixed(this.__defaultFloatPrecision))
                                }
                            }
                            else {
                                displayValue = attributes[key];
                            }
                        }

                        var featureEntryValue = domConstruct.create("span", {className: "imagePopupValue", innerHTML: displayValue});
                        domConstruct.place(featureEntryLbl, featureLiEntry);
                        domConstruct.place(featureEntryValue, featureLiEntry);
                        domConstruct.place(featureLiEntry, featureUL);
                    }
                    return {container: featureContainer, cartIcon: toggleCart};
                },
                handleLayerMouseOver: function (featureAttributes,queryLayerController) {
                    queryLayerController.showThumbnail(featureAttributes);
                },
                handleLayerMouseOut: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.CLEAR);
                },
                _toggleResultContent: function (toggler, content) {
                    if (domClass.contains(toggler, "up")) {
                        domClass.remove(toggler, "up");
                        domClass.add(toggler, "down");
                        domStyle.set(content, "display", "block");
                    }
                    else {
                        domClass.remove(toggler, "down");
                        domClass.add(toggler, "up");
                        domStyle.set(content, "display", "none");
                    }
                },
                handleAddItemToCart: function (imageInfo) {
                    var queryLayerController = IMAGERY_UTILS.getQueryLayerControllerFromItem(imageInfo);
                    var featureId = imageInfo[queryLayerController.layer.objectIdField];
                    var featureToIconLookup = this.featureToCartIconLookup[queryLayerController.id];
                    if (featureToIconLookup && featureToIconLookup[featureId]) {
                        var cartIcon = featureToIconLookup[featureId];
                        domClass.remove(cartIcon, "shoppingCartEmpty");
                        domClass.add(cartIcon, "shoppingCartAdded");
                    }
                },
                handleToggleShowImage: function (queryLayerController, feature) {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.IMAGE.TOGGLE_IMAGE_BY_QUERY_CONTROLLER, queryLayerController, feature);
                },
                handleToggleToCart: function (queryLayerController, feature) {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.IMAGE.TOGGLE_ADD_TO_CART_BY_QUERY_CONTROLLER, queryLayerController, feature);
                },
                onShow: function () {

                },
                handleItemRemovedFromCart: function (itemUUID, imageInfo) {
                    var queryLayerController = IMAGERY_UTILS.getQueryLayerControllerFromItem(imageInfo);
                    var featureId = imageInfo[queryLayerController.layer.objectIdField];
                    var featureToIconLookup = this.featureToCartIconLookup[queryLayerController.id];
                    if (featureToIconLookup && featureToIconLookup[featureId]) {
                        var cartIcon = featureToIconLookup[featureId];
                        domClass.remove(cartIcon, "shoppingCartAdded");
                        domClass.add(cartIcon, "shoppingCartEmpty");
                    }
                }




            });


    });