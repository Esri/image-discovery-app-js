define([
    "dojo/_base/declare",
    "dojo/Evented",
    "dojo/_base/array"
],
    function (declare, Evented, array) {
        return declare(
            [Evented],
            {
                TOGGLE_SHOW_IMAGE_ON_MAP: "showImage",
                SHOW_THUMBNAIL: "showThumbnail",
                TOGGLE_ADD_IMG_TO_SHOPPING_CART: "toggleAddImageToShoppingCart",
                CENTER_AND_FLASH_FOOTPRINT: "panAndFlashFootprint",

                imageInfoArray: ko.observableArray(),

                constructor: function () {
                    var self = this;

                    this.showThumbnailView = function (imageInfoItem) {
                        imageInfoItem.showAttrs(false);
                        if (imageInfoItem.thumbnailURL() == "") {
                            self.emit(self.SHOW_THUMBNAIL, imageInfoItem);
                        }
                        return true; //must have this statement to let the default click action proceed
                    };

                    this.toggleShowImage = function (imageInfoItem) {
                        self.emit(self.TOGGLE_SHOW_IMAGE_ON_MAP, imageInfoItem.imageInfoAndLayer.imageInfo);
                    };

                    this.showAttrsView = function (imageInfoItem) {
                        imageInfoItem.showAttrs(true);
                        return true;    //must have this statement to let the default click action proceed
                    };
                    this.toggleAddImgToShoppingCart = function (imageInfoItem) {
                        var inShoppingCartBool = imageInfoItem.inShoppingCart();
                        imageInfoItem.inShoppingCart(!inShoppingCartBool);
                        self.emit(self.TOGGLE_ADD_IMG_TO_SHOPPING_CART, imageInfoItem.imageInfoAndLayer.imageInfo);
                    };
                    this.centerAndFlashFootprint = function (imageInfoItem) {
                        self.emit(self.CENTER_AND_FLASH_FOOTPRINT, imageInfoItem.imageInfoAndLayer.imageInfo);
                    }

                },
                addImageInfoItem: function (imageInfoItem) {
                    imageInfoItem["showAttrs"] = ko.observable(true);
                    imageInfoItem["thumbnailURL"] = ko.observable("");
                    imageInfoItem["currentView"] = ko.observable("attrsView");
                    imageInfoItem["inShoppingCart"] = ko.observable(imageInfoItem.imageInfoAndLayer.imageInfo.addedToCart);

                    imageInfoItem["radioName"] = ko.observable('showView' + this.imageInfoArray().length);
                    this.imageInfoArray.push(imageInfoItem);
                },
                clearImageInfos: function () {
                    this.imageInfoArray.removeAll();
                },
                findImageInfoItem: function (imageInfo) {
                    var filteredArray = array.filter(this.imageInfoArray(), function (item) {
                        var imgInfo = item.imageInfoAndLayer.imageInfo;
                        if (imgInfo.queryControllerId == imageInfo.queryControllerId &&
                            imgInfo.OBJECTID == imageInfo.OBJECTID) {
                            return true;
                        }
                        return false;
                    });
                    if (filteredArray && filteredArray.length > 0) {
                        return filteredArray[0];
                    }
                    return null;
                },
                removeImageInfoFromShoppingCart: function (imageInfo) {
                    var imageInfoItemFound = this.findImageInfoItem(imageInfo);
                    if (imageInfoItemFound) {
                        imageInfoItemFound.inShoppingCart(false);
                    }
                },
                addImageInfoToShoppingCart: function (imageInfo) {
                    var imageInfoItemFound = this.findImageInfoItem(imageInfo);
                    if (imageInfoItemFound) {
                        imageInfoItemFound.inShoppingCart(true);
                    }
                }
            });

    })
;