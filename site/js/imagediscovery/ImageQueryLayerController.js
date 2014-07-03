define([
    "dojo/_base/declare",
    "dojo/Evented",
    "dojo/topic",
    "dojo/_base/array",
    "dojo/_base/lang",
    "esri/layers/GraphicsLayer",
    "esri/layers/RasterFunction",
    "esri/graphic",
    "esri/layers/ImageServiceParameters",
    "esri/layers/MosaicRule",
    "esriviewer/map/base/LayerQueryParameters"
],
    function (declare, Evented, topic, array, lang, GraphicsLayer, RasterFunction, Graphic, ImageServiceParameters, MosaicRule, LayerQueryParameters) {
        return declare(
            [Evented],
            {
                LOCK_RASTERS_CHANGED: "lockRastersChanged",
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    if (this.layer) {
                        this._createLayerFieldLookup();
                    }
                    this.currentLockRasterIds = [];
                    this.id = VIEWER_UTILS.generateUUID();
                    this.currentMosaicOperation = MosaicRule.OPERATION_FIRST;

                    //create a footprint graphics layer
                    this.footprintGraphics = new GraphicsLayer();
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD_GRAPHICS_LAYER, this.footprintGraphics);
                    this.initListeners();
                },
                initListeners: function () {
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.TRANSPARENCY.SET, lang.hitch(this, this.handleSetTransparency));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP, lang.hitch(this, this.handleClearLayerManipulations));
                    //we dont want to show imagery when the cluster layer is visible
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_DISPLAYED, lang.hitch(this, this.showLayer));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.CLUSTER_LAYER_DISPLAYED, lang.hitch(this, this.hideLayer));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.REORDER_BANDS, lang.hitch(this, this.handleBandReorder));

                },
                _createLayerFieldLookup: function () {
                    this.layerFieldsLookup = {};
                    if (this.layer && this.layer.fields) {
                        for (var i = 0; i < this.layer.fields.length; i++) {
                            this.layerFieldsLookup[this.layer.fields[i].name] = this.layer.fields[i];
                        }
                    }
                },
                /**
                 * listener on IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP
                 * clears raster functions and band reordering for the layer
                 */
                handleClearLayerManipulations: function () {
                    if (this.layer) {
                        this.layer.setBandIds([]);
                    }
                    this.clearRasterFunction();
                },
                /**
                 * listener on VIEWER_GLOBALS.EVENTS.MAP.LAYERS.TRANSPARENCY.SET
                 * sets the transparency of the layer
                 * @param transparency
                 */
                handleSetTransparency: function (transparency) {
                    if (this.layer) {
                        this.layer.setOpacity(1 - transparency);
                    }
                },
                /**
                 * returns true if the contained layer has lock raster applied
                 * @return {boolean}
                 */
                hasLockRasters: function () {
                    return this.currentLockRasterIds.length > 0;
                },
                handleBandReorder: function(bandOrder,refresh){
                    this.layer.setBandIds(bandOrder);
                    if(refresh){
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Bands Reordered");
                      this.layer.refresh();
                    }
                },
                /**
                 * reorders the layers band ordering to the passed bands array
                 * @param bandsArray array of band ids to order on the layer
                 */
                reorderBands: function (bandsArray) {
                    //check to see if the band ordering has changed
                    if (bandsArray == null || !lang.isArray(bandsArray)) {
                        bandsArray = [];
                    }
                    this.layer.setBandIds(bandsArray);
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Bands Reordered");

                },

                /**
                 * updates the mosaic rule for the layer
                 */
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
                /**
                 *  takes in an object containing a function that returns a rendering rule
                 * @param objectWithCreateRasterFunction   object containing a createRasterFunction function which returns a raster function to apply as a rendering rule
                 */
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
                /**
                 * clears the raster function on the layer
                 */
                clearRasterFunction: function () {
                    if (this.layer && this.layer.renderingRule != null) {
                        VIEWER_UTILS.debug("Cleared Raster Function");
                        this.layer.setRenderingRule(new RasterFunction());
                    }
                },

                /**
                 * shows a single footprint
                 * @param resultEntry
                 */
                showFootprint: function (resultEntry) {
                    this.emit("showFootprint", resultEntry);
                },
                /**
                 * hides the passed footprint
                 * @param resultEntry
                 */
                hideFootprint: function (resultEntry) {
                    this.emit("hideFootprint", resultEntry);
                },
                /**
                 * sets the lock rasters from the entries array
                 * @param entries
                 */
                setLockIds: function (entries) {
                    var i;
                    var newLockRasterIds = [];
                    for (i = 0; i < entries.length; i++) {
                        var currentObjectId = entries[i][this.layer.objectIdField];
                        newLockRasterIds.push(currentObjectId);
                    }
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.CLEAR);

                    if (newLockRasterIds.length == this.currentLockRasterIds.length && this.currentLockRasterIds.length > 0) {
                        // see if the arrays are the same
                        var checkArray = this.currentLockRasterIds.slice(0);
                        var newLockrasterIdsCheck = newLockRasterIds.slice(0);
                        checkArray.sort();
                        newLockrasterIdsCheck.sort();
                        if (checkArray.join(",") == newLockrasterIdsCheck.join(",")) {
                            return;
                        }
                    }
                    this.currentLockRasterIds = newLockRasterIds;
                    this.updateMosaicRule();
                    this.emit(this.LOCK_RASTERS_CHANGED, this.currentLockRasterIds);
                    VIEWER_UTILS.debug("Set Lock Raster Ids");
                },
                /**
                 * clears all the lock ids on the image service
                 */
                clearLockIds: function () {
                    if (this.layer) {
                        this.layer.hide();
                    }
                    if (this.currentLockRasterIds.length > 0) {
                        this.currentLockRasterIds = [];
                        this.emit(this.LOCK_RASTERS_CHANGED, this.currentLockRasterIds);
                        VIEWER_UTILS.debug("Cleared Lock Raster Ids");
                    }
                },
                /**
                 * gets the thumbnail for an image
                 * @param imageInfo
                 * @param dimensions
                 * @param callback
                 */
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
                /**
                 * returns the current rendering rule for the layer
                 * @return {*}
                 */
                getCurrentRenderingRule: function () {
                    return this.layer.renderingRule;
                },
                /**
                 * gets the current mosaic rule for the layer
                 * @return {esri.layers.MosaicRule}
                 */
                getCurrentMosaicRule: function () {
                    var mr = new MosaicRule();
                    mr.method = MosaicRule.METHOD_LOCKRASTER;
                    mr.ascending = true;
                    mr.operation = this.currentMosaicOperation;
                    mr.lockRasterIds = this.currentLockRasterIds;
                    return mr;
                },
                /**
                 * returns true if there is a rendering rule on the layer
                 * @return {boolean}
                 */
                hadRenderingRule: function () {
                    return this.layer.renderingRule != null;
                },
                /**
                 * returns true if there is a mosaic rule on the layer
                 * @return {boolean}
                 */
                hasMosaicRule: function () {
                    return this.currentLockRasterIds != null && this.currentLockRasterIds.length > 0;
                },
                /**
                 * hides the layer
                 */
                hideLayer: function () {
                    this.layer.hide();
                },
                /**
                 * displays the layer
                 */
                showLayer: function () {
                    if (this.hasLockRasters()) {
                        this.layer.show();
                    }
                },
                showThumbnail: function (resultEntry) {
                   // var objectId = resultEntry[this.layer.objectIdField];
                 //   if (this.serviceConfiguration.supportsThumbnails && array.indexOf(this.currentLockRasterIds, objectId) < 0) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.SHOW, resultEntry, this.layer.url);
                  //  }
                },
                supportsThumbnail: function () {
                 //   return this.serviceConfiguration.supportsThumbnails != null && this.serviceConfiguration.supportsThumbnails == true;
                    return true;
                },
                queryForGeometriesFromObjectIds: function (objectIds, callback, errback) {
                    var layerQueryParameters = new LayerQueryParameters({
                        returnGeometry: true,
                        outFields: [],
                        callback: callback,
                        layer: this.layer,
                        objectIds: objectIds
                    });
                    if (errback != null && lang.isFunction(errback)) {
                        layerQueryParameters.errback = errback;
                    }
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.QUERY_LAYER, layerQueryParameters);
                }
            });
    });