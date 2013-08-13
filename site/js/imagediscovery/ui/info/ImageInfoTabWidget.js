define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageInfoTabContainerTemplate.html",
    "xstyle/css!./theme/ImageInfoTheme.css",
    "dojo/topic",
    "dojo/date/locale",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "esriviewer/ui/base/UITemplatedWidget",
    "./model/ImageInfoViewModel"
],
    function (declare, template,theme, topic, locale, lang, domConstruct, domClass, UITemplatedWidget, ImageInfoViewModel) {
        return declare(
            [UITemplatedWidget],
            {
                __defaultFloatPrecision: 3,
                __defaultDateFormat: "dd-MM-yyyy",
                defaultHideFields: {__serviceLabel: "__serviceLabel", queryControllerId: "queryControllerId", isHighlighted: "isHighlighted", isGrayedOut: "isGrayedOut", SrcImgID: "SrcImgID", MinPS: "MinPS", MaxPS: "MaxPS", LowPS: "LowPS", HighPS: "HighPS", Category: "Category", id: "id", geometry: "geometry", _storeId: "_storeId", isFiltered: "isFiltered", addedToCart: "addedToCart", showThumbNail: "showThumbNail", showFootprint: "showFootprint", OBJECTID: "OBJECTID", Shape_Area: "Shape_Area", Shape_Length: "Shape_Length" },
                thumbnailDimensions: {h: 200, w: 200},
                templateString: template,
                constructor: function (params) {
                    this.dateFormat = null;
                    lang.mixin(this, params || {});
                },
                initListeners: function() {
                    //when user adds item to shopping cart from Results view
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.ADD_TO, lang.hitch(this, this.handleAddItemToCart));
                    //when user removes item from cart from Results view
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVE_FROM_CART, lang.hitch(this, this.handleItemRemovedFromCart));
                    //when user removes item from cart from ShoppingCart view
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.REMOVED_FROM_CART, lang.hitch(this, this.handleItemRemovedFromCart));
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new ImageInfoViewModel();
                    this.viewModel.on(this.viewModel.TOGGLE_SHOW_IMAGE_ON_MAP, lang.hitch(this, this.handleToggleShowImage));
                    this.viewModel.on(this.viewModel.SHOW_THUMBNAIL, lang.hitch(this, this.showThumbNail));
                    this.viewModel.on(this.viewModel.TOGGLE_ADD_IMG_TO_SHOPPING_CART, lang.hitch(this, this.handleToggleAddImageToShoppingCart));
                    ko.applyBindings(this.viewModel, this.domNode);
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
                },


                // ************  OLD setImageInfo function
                /*
                setImageInfo: function (imageInfo, layer) {
                    //takes in an image info object and a layer.
                    //populates all attributes from image info and retrieves the thumbnail for the row from the layer

                    //save the image info (this object represents a record in the results grid)
                    this.imageInfo = imageInfo;

                    var fieldTypeLookup = this.getFieldTypeLookup(layer);
                    domConstruct.empty(this.imageInfoEntryList);
                    for (var key in imageInfo) {
                        if (this.defaultHideFields[key] != null) {
                            continue;
                        }
                        var liItem = domConstruct.create("div", {className: "imageInfoAttributeEntry"});
                        var lbl = domConstruct.create("span", {className: "imageInfoAttributeEntryLbl", innerHTML: key + ": "});
                        var isEmptyDisplayValue = false;
                        var displayValue;
                        if (imageInfo[key] == null || imageInfo[key] === "") {
                            displayValue = "*Empty*";
                            isEmptyDisplayValue = true;
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
                        var displayValueSpan = domConstruct.create("span", {innerHTML: displayValue});
                        if (isEmptyDisplayValue) {
                            domClass.add(displayValueSpan, "emptyImageInfoValueEntry");
                        }
                        var displayValueSpanOuter = domConstruct.create("span", {className: "imageInfoAttributeEntryValue"});
                        domConstruct.place(displayValueSpan, displayValueSpanOuter);
                        domConstruct.place(lbl, liItem);
                        domConstruct.place(displayValueSpanOuter, liItem);
                        domConstruct.place(liItem, this.imageInfoEntryList);
                    }
                    //finally, set the thumbnail
                    this.setThumbnail(imageInfo);
                },
                setThumbnail: function (imageInfo) {
                    //using the query controller, get the image thumbnail
                    var queryController;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET_BY_ID, imageInfo.queryControllerId, function (qCon) {
                        queryController = qCon;
                    });
                    if (queryController) {
                        queryController.getImageInfoThumbnail(imageInfo, this.thumbnailDimensions, lang.hitch(this, this.handleThumbnailResponse));
                    }
                },
                handleThumbnailResponse: function (response) {
                    domConstruct.empty(this.thumbnailContainer);
                    if (response && response.href) {
                        var img = domConstruct.create("img", {src: response.href, className: "imageInfoThumbnail"});
                        domConstruct.place(img, this.thumbnailContainer);
                    }
                },
                */
                getFieldTypeLookup: function (layer) {
                    var fieldTypeLookup = {
                        dateLookup: {},
                        doubleLookup: {},
                        domainLookup: {}
                    };
                    if (layer && layer.fields) {
                        //todo: put this in a hash
                        var currentField;
                        for (var i = 0; i < layer.fields.length; i++) {
                            currentField = layer.fields[i];
                            if (currentField.type === VIEWER_GLOBALS.ESRI_FIELD_TYPES.DATE) {
                                fieldTypeLookup.dateLookup[currentField.name] = currentField;
                            }
                            else if (currentField.type === VIEWER_GLOBALS.ESRI_FIELD_TYPES.DOUBLE) {
                                fieldTypeLookup.doubleLookup[currentField.name] = currentField;
                            }
                            else if (currentField.domain != null && layer.fields[i].domain.codedValues != null) {
                                fieldTypeLookup.domainLookup[currentField.name] = currentField;
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

                //show/hide image on the map
                handleToggleShowImage: function(imageInfo) {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.TOGGLE_SHOW_IMAGE, imageInfo);

                },
                //show thumbnail view
                showThumbNail: function(imageInfoItem) {
                    //using the query controller, get the image thumbnail
                    var queryController;
                    var imageInfo = imageInfoItem.imageInfoAndLayer.imageInfo;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET_BY_ID, imageInfo.queryControllerId, function (qCon) {
                        queryController = qCon;
                    });
                    if (queryController) {
                        queryController.getImageInfoThumbnail(imageInfo, this.thumbnailDimensions,
                            lang.hitch(this, this.handleThumbnailResponse_new, imageInfoItem));
                    }
                },
                handleThumbnailResponse_new: function (imageInfoItem, response) {
                    if (response && response.href) {
                        imageInfoItem.thumbnailURL(response.href);
                    }
                },
                handleToggleAddImageToShoppingCart: function(imageInfoItem) {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.TOGGLE_ADD_IMAGE_TO_SHOPPING_CART, imageInfoItem);
                },
                //set content of the image info popup
                setImageInfos: function (imageInfoAndLayerArray) {
                    //takes in an array where each element contains an image info object and its associated layer.
                    //populates all attributes from image info and retrieves the thumbnail for the row from the layer

                    this.viewModel.clearImageInfos();

                    for (var i = 0; i < imageInfoAndLayerArray.length; i++) {
                        var imageInfoAndLayer = imageInfoAndLayerArray[i];
                        var imageInfo = imageInfoAndLayer.imageInfo;
                        var layer = imageInfoAndLayer.layer; //will be used to retrieve thumbnail
                        var fieldTypeLookup = this.getFieldTypeLookup(layer);

                        var attributesNVPArray = [];
                        for (var key in imageInfo) {
                            if (this.defaultHideFields[key] != null) {
                                continue;
                            }

                            var displayValue;
                            if (imageInfo[key] == null || imageInfo[key] === "") {
                                displayValue = "*Empty*";
                                //isEmptyDisplayValue = true;
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
                            attributesNVPArray.push({name: key, value: displayValue});

                        } //end for loop of attributes in imageInfo object

                        this.viewModel.addImageInfoItem(
                            {attributes: attributesNVPArray, imageInfoAndLayer: imageInfoAndLayer}
                        );

                    }//end for loop of imageInfoAndLayerArray elements
                },
                handleItemRemovedFromCart: function (resultId, imageInfo) {
                    this.viewModel.removeImageInfoFromShoppingCart(imageInfo);
                },
                handleAddItemToCart: function (imageInfo) {
                    this.viewModel.addImageInfoToShoppingCart(imageInfo);
                }
            })
    });