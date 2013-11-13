define([
    "dojo/_base/declare",
    "dijit/TooltipDialog",
    "dojo/_base/lang",
    "dojo/date/locale",
    "dojo/topic",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/on",
    "dojo/_base/window",
    "dojo/_base/array",
    "esri/geometry/screenUtils"
],
    function (declare, TooltipDialog, lang, locale, topic, domConstruct, domClass, on, dojoWindow, array, screenUtils) {
        return declare(
            [],
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
                    Shape_Length: "Shape_Length"
                },
                constructor: function () {
                    this.loadViewerConfigurationData();
                    this.initListeners();
                    this.popupTooltip = new TooltipDialog();
                    //get map reference
                    var map;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GET, function (mapInstance) {
                        map = mapInstance;
                    });
                    this.map = map;
                },
                initListeners: function () {
                    var hideCurrentPopupScoped = lang.hitch(this, this.hidePopup);
                    //when user adds item to shopping cart from Results view
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.ADD_TO, lang.hitch(this, this.handleAddItemToCart));
                    //when user removes item from cart from Results view
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVE_FROM_CART, lang.hitch(this, this.handleItemRemovedFromCart));
                    //when user removes item from cart from ShoppingCart view
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVED_FROM_CART, lang.hitch(this, this.handleItemRemovedFromCart));
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.CHANGED, hideCurrentPopupScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.DISPLAYED, hideCurrentPopupScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, hideCurrentPopupScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.SHOW_POPUP, lang.hitch(this, this.show));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.SHOW_POPUP_FROM_MAP_COORDINATES, lang.hitch(this, this.showFromMapCoordinates));
                },
                hidePopup: function () {
                    if (this.anchorDiv != null) {
                        domConstruct.destroy(this.anchorDiv);
                        this.anchorDiv = null;
                    }
                    dijit.popup.close(this.popupTooltip);

                    this.currentToggleCartIcon = null;
                },
                loadViewerConfigurationData: function () {
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
                showFromMapCoordinates: function (itemInfo, mapPoint) {
                    var screenCoordinates = screenUtils.toScreenGeometry(this.map.extent, this.map.width, this.map.height, mapPoint);
                    this.show(itemInfo, screenCoordinates);
                },
                show: function (itemInfo, displayPoint) {
                    this.hidePopup();
                    this.anchorDiv = domConstruct.create("div", {style: {height: "1px", width: "1px",position:"absolute",left:displayPoint.x + "px", top: displayPoint.y + "px"}});
                    domConstruct.place(this.anchorDiv, dojoWindow.body());
                    this.currentImageInfoPopupObject = this.processImageInfo(itemInfo);
                    if (this.currentImageInfoPopupObject && this.currentImageInfoPopupObject.imageInfoAndLayer) {
                        this.popupTooltip.set("content",this.getHTML(this.currentImageInfoPopupObject));
                        dijit.popup.open({
                            popup: this.popupTooltip,
                            around: this.anchorDiv,
                            orient: ["above", "below"]
                        });
                    }
                },
                getHTML: function (currentImageInfoPopupObject) {
                    var container = domConstruct.create("div");
                    var actionsContainer = domConstruct.create("div", {className: "imagePopupActionsContainer"});
                    domConstruct.place(actionsContainer, container);
                    var closePopup = domConstruct.create("div", {className: "imagePopupCloseIcon windowAction close"});
                    on(closePopup, "click", lang.hitch(this, this.hidePopup));

                    domConstruct.place(closePopup, actionsContainer);
                    var toggleImage = domConstruct.create("div", {className: "showImageHeaderIcon", title: "Toggle Image"});
                    on(toggleImage, "click", lang.hitch(this, this.handleToggleShowImage));
                    domConstruct.place(toggleImage, actionsContainer);

                    //shoppingCartAdded
                    var cartClass = currentImageInfoPopupObject.imageInfoAndLayer.imageInfo.addedToCart ? "shoppingCartAdded" : "shoppingCartEmpty";
                    var toggleCart = domConstruct.create("div", {className: "commonIcons16 shoppingCartHeaderIcon " + cartClass, title: "Toggle Cart", style: {marginRight: "10px"}});
                    this.currentToggleCartIcon = toggleCart;
                    on(toggleCart, "click", lang.hitch(this, this.handleToggleAddToCart));
                    domConstruct.place(toggleCart, actionsContainer);

                    if (currentImageInfoPopupObject.imageInfoAndLayer.queryLayerController.supportsThumbnail()) {

                        var showThumb = domConstruct.create("div", {className: "commonIcons16 binoculars"});
                        on(showThumb, "mouseover", lang.hitch(this, this.handleLayerMouseOver));
                        on(showThumb, "mouseout", lang.hitch(this, this.handleLayerMouseOut));
                        domConstruct.place(showThumb, actionsContainer);
                    }

                    var currentAttributeObj;
                    for (var i = 0; i < currentImageInfoPopupObject.attributes.length; i++) {
                        currentAttributeObj = currentImageInfoPopupObject.attributes[i];
                        var entry = domConstruct.create("div", {className: "imagePopupEntry"});
                        var lbl = domConstruct.create("span", {className: "imagePopupLabel", innerHTML: currentAttributeObj.name + ": "});
                        var value = domConstruct.create("span", {className: "imagePopupValue", innerHTML: currentAttributeObj.value});
                        domConstruct.place(lbl, entry);
                        domConstruct.place(value, entry);
                        domConstruct.place(entry, container);

                    }
                    return container;
                },
                processImageInfo: function (imageInfo) {
                    var queryLayerController = IMAGERY_UTILS.getQueryLayerControllerFromItem(imageInfo);
                    var fieldMapping = {};
                    if (queryLayerController.serviceConfiguration &&
                        queryLayerController.serviceConfiguration.fieldMapping != null &&
                        lang.isObject(queryLayerController.serviceConfiguration.fieldMapping)) {
                        fieldMapping = queryLayerController.serviceConfiguration.fieldMapping;
                    }
                    var reverseFieldMapping = {};
                    for (var key in fieldMapping) {
                        reverseFieldMapping[fieldMapping[key]] = key;
                    }
                    var layer = queryLayerController.layer; //will be used to retrieve thumbnail
                    var fieldTypeLookup = this.getFieldTypeLookup(queryLayerController);
                    var attributesNVPArray = [];
                    for (var key in imageInfo) {
                        var isAddableField = this.popupDisplayFields != null ? (array.indexOf(this.popupDisplayFields, key) > -1) : true;
                        if (!isAddableField) {
                            continue;
                        }
                        if (this.defaultHideFields[key] != null) {
                            //make sure the field isn't in the configuration popup fields
                            continue;
                        }
                        var displayValue;
                        if (imageInfo[key] == null || imageInfo[key] === "") {
                            displayValue = "*Empty*";
                        }
                        else {
                            //check if we need to format an attribute entry
                            if (fieldTypeLookup.dateLookup[key] != null) {
                                displayValue = this.getFormattedDate(imageInfo[key]);

                            }
                            else if (fieldTypeLookup.doubleLookup[key] != null) {
                                if (this.displayFormats && this.displayFormats.floatPrecision != null) {
                                    displayValue = parseFloat(imageInfo[key].toFixed(this.displayFormats.floatPrecision));
                                }
                                else {
                                    displayValue = parseFloat(imageInfo[key].toFixed(this.__defaultFloatPrecision))
                                }
                            }
                            else {
                                displayValue = imageInfo[key];
                            }
                        }
                        var colName = reverseFieldMapping[key] != null ? reverseFieldMapping[key] : key
                        attributesNVPArray.push({name: colName, value: displayValue});

                    } //end for loop of attributes in imageInfo object


                    return {attributes: attributesNVPArray, imageInfoAndLayer: {imageInfo: imageInfo, layer: layer, queryLayerController: queryLayerController}};

                },
                getFieldTypeLookup: function (queryLayerController) {
                    var fieldTypeLookup = {
                        dateLookup: {},
                        doubleLookup: {},
                        domainLookup: {}
                    };
                    var layer = queryLayerController.layer;
                    var fieldMapping = {};
                    if (queryLayerController.serviceConfiguration &&
                        queryLayerController.serviceConfiguration.fieldMapping != null &&
                        lang.isObject(queryLayerController.serviceConfiguration.fieldMapping)) {
                        fieldMapping = queryLayerController.serviceConfiguration.fieldMapping;
                    }
                    if (layer && layer.fields) {
                        //todo: put this in a hash
                        var currentField;
                        for (var i = 0; i < layer.fields.length; i++) {
                            currentField = layer.fields[i];
                            var mappedFieldName = currentField.name;
                            if (fieldMapping[mappedFieldName] != null) {
                                mappedFieldName = fieldMapping[mappedFieldName];
                            }
                            var fieldType = IMAGERY_UTILS.getFieldTypeFromQueryLayerController(currentField.name, queryLayerController);
                            if (fieldType === VIEWER_GLOBALS.ESRI_FIELD_TYPES.DATE) {
                                fieldTypeLookup.dateLookup[mappedFieldName] = currentField;
                            }
                            else if (fieldType === VIEWER_GLOBALS.ESRI_FIELD_TYPES.DOUBLE) {
                                fieldTypeLookup.doubleLookup[mappedFieldName] = currentField;
                            }
                            else if (currentField.domain != null && layer.fields[i].domain.codedValues != null) {
                                fieldTypeLookup.domainLookup[mappedFieldName] = currentField;
                            }
                        }
                    }
                    return fieldTypeLookup;
                },
                getFormattedDate: function (value) {
                    try {
                        var date = new Date(value);
                        var formatter = this.displayFormats.date != null ? this.displayFormats.date : this.__defaultDateFormat;
                        return locale.format(date, {selector: "date", datePattern: formatter});
                    }
                    catch (err) {
                        return null;
                    }
                },
                handleToggleShowImage: function () {
                    if (this.currentImageInfoPopupObject) {
                        var imageInfo = this.currentImageInfoPopupObject.imageInfoAndLayer.imageInfo;
                        topic.publish(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.TOGGLE_SHOW_IMAGE, imageInfo);
                    }

                },
                handleLayerMouseOver: function () {
                    var imageInfo = this.currentImageInfoPopupObject.imageInfoAndLayer.imageInfo;
                    var queryLayerController = this.currentImageInfoPopupObject.imageInfoAndLayer.queryLayerController;
                    queryLayerController.showThumbnail(imageInfo);
                },
                handleLayerMouseOut: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.CLEAR);
                },
                handleToggleAddToCart: function () {
                    if (this.currentImageInfoPopupObject && this.currentImageInfoPopupObject.imageInfoAndLayer && this.currentImageInfoPopupObject.imageInfoAndLayer.imageInfo) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.TOGGLE_ADD_IMAGE_TO_SHOPPING_CART, this.currentImageInfoPopupObject.imageInfoAndLayer.imageInfo);
                    }
                },
                handleItemRemovedFromCart: function () {
                    if (this.currentToggleCartIcon) {
                        domClass.remove(this.currentToggleCartIcon, "shoppingCartAdded");
                        domClass.add(this.currentToggleCartIcon, "shoppingCartEmpty");
                    }

                },
                handleAddItemToCart: function (imageInfo) {
                    if (this.currentToggleCartIcon) {
                        domClass.remove(this.currentToggleCartIcon, "shoppingCartEmpty");
                        domClass.add(this.currentToggleCartIcon, "shoppingCartAdded");
                    }
                }
            })
            ;
    })
;