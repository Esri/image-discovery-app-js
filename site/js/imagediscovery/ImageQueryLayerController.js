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
                visibleFootprintCount: 0,
                footprintPolygonSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([255, 0, 0]), 1), new Color([255, 0, 0, 0])),
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    this.currentLockRasterIds = [];
                    this.footprintGraphicsCache = {};
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
                //clears all footprints on the map
                clearFootprints: function () {
                    this.footprintGraphics.clear();
                    this.footprintGraphicsCache = {};
                    this.visibleFootprintCount = 0;
                    VIEWER_UTILS.debug("Cleared Query Layer Footprints");
                },
                deleteFootprint: function (resultEntry) {
                    if (this.footprintGraphicsCache[resultEntry.id]) {
                        this.footprintGraphics.remove(this.footprintGraphicsCache[resultEntry.id]);
                        VIEWER_UTILS.debug("Deleted Footprint");
                        delete this.footprintGraphicsCache[resultEntry.id];
                        --this.visibleFootprintCount;
                    }
                },
                //shows footprints in the passed array
                showFootprints: function (resultEntries) {
                    for (var i = 0; i < resultEntries.length; i++) {
                        this.showFootprint(resultEntries[i]);
                    }
                },
                hideFootprints: function () {
                    VIEWER_UTILS.debug("Hiding All Query Layer Footprints");
                    this.footprintGraphics.hide();
                },
                //shows a single footprint
                showFootprint: function (resultEntry) {
                    if (resultEntry != null) {
                        if (!this.footprintGraphics.visible) {
                            this.footprintGraphics.show();
                        }
                        if (this.footprintGraphicsCache[resultEntry.id]) {
                            this.footprintGraphicsCache[resultEntry.id].show();
                        }
                        else if (resultEntry.geometry != null) {
                            var graphic = new Graphic(resultEntry.geometry, this.footprintPolygonSymbol);
                            this.footprintGraphics.add(graphic);
                            this.footprintGraphicsCache[resultEntry.id] = graphic;
                            this.visibleFootprintCount++;
                        }
                    }
                },
                centerAndFlashFootprint: function (resultEntry) {
                    if (resultEntry != null) {
                        if (!this.footprintGraphics.visible) {
                            this.footprintGraphics.show();
                        }
                        var graphicEntry = this.footprintGraphicsCache[resultEntry.id];
                        if (graphicEntry) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.CENTER_AND_FLASH, graphicEntry);

                        }
                    }
                },
                //hides the passed footprint
                hideFootprint: function (resultEntry) {
                    if (resultEntry != null && resultEntry.id != null) {
                        if (this.footprintGraphicsCache[resultEntry.id]) {
                            this.footprintGraphicsCache[resultEntry.id].hide();
                        }
                    }
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
                }
            });
    });