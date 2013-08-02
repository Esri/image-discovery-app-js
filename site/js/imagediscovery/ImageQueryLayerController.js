define([
    "dojo/_base/declare",
    "dojo/Evented",
    "dojo/topic",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/_base/Color",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/layers/GraphicsLayer",
    "esri/layers/RasterFunction",
    "esri/graphic",
    "esri/layers/ImageServiceParameters",
    "esri/layers/MosaicRule"
],
    function (declare, Evented, topic, con, lang, Color, SimpleFillSymbol, SimpleLineSymbol, GraphicsLayer, RasterFunction, Graphic, ImageServiceParameters, MosaicRule) {
        return declare(
            [Evented],
            {
                LOCK_RASTERS_CHANGED: "lockRastersChanged",
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    this.currentLockRasterIds = [];
                    this.id = VIEWER_UTILS.generateUUID();
                    this.currentMosaicOperation = MosaicRule.OPERATION_FIRST;

                    //create a footprint graphics layer
                    this.footprintGraphics = new GraphicsLayer();
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD_GRAPHICS_LAYER, this.footprintGraphics);
                    this.initListeners();
                },
                initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.CLEAR_ALL, lang.hitch(this, this.clearLockIds));
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.TRANSPARENCY.SET, lang.hitch(this, this.handleSetTransparency));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP, lang.hitch(this, this.handleClearLayerManipulations));
                    //we dont want to show imagery when the cluster layer is visible
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_DISPLAYED, lang.hitch(this, this.showLayer));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.CLUSTER_LAYER_DISPLAYED, lang.hitch(this, this.hideLayer));

                },
                handleClearLayerManipulations: function () {
                    if (this.layer) {
                        this.layer.setBandIds([]);
                    }
                    this.clearRasterFunction();
                },
                handleSetTransparency: function (transparency) {
                    if (this.layer) {
                        this.layer.setOpacity(1 - transparency);
                    }
                },
                hasLockRasters: function () {
                    return this.currentLockRasterIds.length > 0;
                },
                reorderBands: function (bandsArray) {
                    //check to see if the band ordering has changed
                    if (bandsArray == null || !lang.isArray(bandsArray)) {
                        bandsArray = [];
                    }
                    this.layer.setBandIds(bandsArray);
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Bands Reordered");

                },
                updateMosaicRule: function () {
                    var i;
                    if (this.currentLockRasterIds.length > 0) {
                        var mr = this.getCurrentMosaicRule();
                        this.layer.setMosaicRule(mr);
                        if (!this.layer.visible)
                            this.layer.show();
                    }
                    else {
                        this.layer.mosaicRule = null;
                        if (this.layer.visible) {
                            this.layer.hide();
                        }
                    }
                    VIEWER_UTILS.debug("Updated Mosaic Rule");
                },
                applyRasterFunction: function (objectWithCreateRasterFunction) {
                    if (objectWithCreateRasterFunction == null || objectWithCreateRasterFunction.createRasterFunction == null || !lang.isFunction(objectWithCreateRasterFunction.createRasterFunction)) {
                        return;
                    }
                    if (this.currentLockRasterIds.length > 0) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Raster Function Applied");
                        this.layer.setRenderingRule(objectWithCreateRasterFunction.createRasterFunction(this.layer));
                        VIEWER_UTILS.debug("Raster Function Applied");
                    }
                },
                clearRasterFunction: function () {
                    if (this.layer && this.layer.renderingRule != null) {
                        VIEWER_UTILS.debug("Cleared Raster Function");
                        this.layer.setRenderingRule(new RasterFunction());
                    }
                },

                //shows a single footprint
                showFootprint: function (resultEntry) {
                    this.emit("showFootprint", resultEntry);
                },
                //hides the passed footprint
                hideFootprint: function (resultEntry) {
                    this.emit("hideFootprint", resultEntry);
                },
                //sets the lock rasters from the entries array
                setLockIds: function (entries) {
                    this.currentLockRasterIds = [];
                    var i;
                    for (i = 0; i < entries.length; i++) {
                        this.currentLockRasterIds.push(entries[i][this.layer.objectIdField]);
                    }
                    this.updateMosaicRule();
                    this.emit(this.LOCK_RASTERS_CHANGED, this.currentLockRasterIds);
                    VIEWER_UTILS.debug("Set Lock Raster Ids");
                },
                //clears all the lock ids on the image service
                clearLockIds: function () {
                    if (this.layer) {
                        this.layer.hide();
                    }
                    this.currentLockRasterIds = [];
                    this.emit(this.LOCK_RASTERS_CHANGED, this.currentLockRasterIds);
                    VIEWER_UTILS.debug("Cleared Lock Raster Ids");
                },
                //gets the thumbnail for an image
                getImageInfoThumbnail: function (imageInfo, dimensions, callback) {
                    VIEWER_UTILS.debug("Image Info Requested");
                    if (callback == null || !lang.isFunction(callback)) {
                        return;
                    }
                    var imageParams = new ImageServiceParameters();
                    imageParams.extent = imageInfo.geometry.getExtent();
                    imageParams.height = dimensions.h;
                    imageParams.width = dimensions.w;
                    var mr = new MosaicRule();
                    mr.method = MosaicRule.METHOD_LOCKRASTER;
                    mr.ascending = true;
                    mr.operation = this.currentMosaicOperation;
                    mr.lockRasterIds = [imageInfo[this.layer.objectIdField]];
                    imageParams.mosaicRule = mr;
                    this.layer.exportMapImage(imageParams, callback);
                },

                getCurrentRenderingRule: function () {
                    return this.layer.renderingRule;
                },
                getCurrentMosaicRule: function () {
                    var mr = new MosaicRule();
                    mr.method = MosaicRule.METHOD_LOCKRASTER;
                    mr.ascending = true;
                    mr.operation = this.currentMosaicOperation;
                    mr.lockRasterIds = this.currentLockRasterIds;
                    return mr;
                },
                hadRenderingRule: function () {
                    return this.layer.renderingRule != null;
                },
                hasMosaicRule: function () {
                    return this.currentLockRasterIds != null && this.currentLockRasterIds.length > 0;
                },
                hideLayer: function () {
                    this.layer.hide();
                },
                showLayer: function () {
                    if (this.hasLockRasters()) {
                        this.layer.show();
                    }
                }
            });
    });