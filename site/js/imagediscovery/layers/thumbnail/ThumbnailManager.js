define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "esri/symbols/PictureMarkerSymbol",
    "esri/geometry/Point",
    "esri/SpatialReference",
    "esri/graphic",
    "esri/geometry/Extent",
    "esri/geometry/screenUtils",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "dojo/_base/Color" ,
    "esriviewer/base/DataLoaderSupport",
    "esri/layers/GraphicsLayer"

],
    function (declare, topic, lang, PictureMarkerSymbol, Point, SpatialReference, Graphic, Extent, screenUtils, SimpleFillSymbol, SimpleLineSymbol, Color, DataLoaderSupport, GraphicsLayer) {
        return declare(
            [DataLoaderSupport],
            {
                constructor: function () {
                    var map;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GET, function (mapInstance) {
                        map = mapInstance;
                    });
                    this.thumbnailGraphicsLayer = new GraphicsLayer();
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD_EXTERNAL_MANAGED_LAYER, this.thumbnailGraphicsLayer);
                    this.thumbnailInfoCache = {};
                    this.map = map;
                    this.initListeners();


                },
                initListeners: function () {
                    var clearGraphicsScoped = lang.hitch(this, this.clearThumbnails);
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.CHANGED, clearGraphicsScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, clearGraphicsScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.SHOW, lang.hitch(this, this.handleShowThumbnail));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.CLEAR, clearGraphicsScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.REMOVE, lang.hitch(this, this.removeThumbnail));
                },
                handleShowThumbnail: function (objectId, layerUrl) {
                    //check cache
                    if (this.thumbnailInfoCache[layerUrl] != null) {
                        var item;
                        if ((item = this.thumbnailInfoCache[layerUrl][objectId]) != null) {
                            this.updateThumbnail(item);
                            return;
                        }
                    }
                    var itemUrl = VIEWER_UTILS.joinUrl(layerUrl, objectId);
                    var infoUrl = VIEWER_UTILS.joinUrl(itemUrl, "info");
                    var thumbnailUrl = VIEWER_UTILS.joinUrl(itemUrl, "thumbnail");
                    this.loadJsonP(infoUrl, {f: "json"}, lang.hitch(this, this.handleThumbnailInfoLoaded, objectId, layerUrl, thumbnailUrl));
                },
                handleThumbnailInfoLoaded: function (objectId, layerUrl, thumbnailUrl, info) {
                    if (info == null) {
                        return;
                    }
                    if (this.thumbnailInfoCache[layerUrl] == null) {
                        this.thumbnailInfoCache[layerUrl] = {};
                    }
                    topic.publish(VIEWER_GLOBALS.EVENTS.GEOMETRY_SERVICE.TASKS.PROJECT_TO_MAP_SR, new Extent(info.extent), lang.hitch(this, function (ext) {
                        var item = {extent: ext[0], thumbnailUrl: thumbnailUrl};
                        this.thumbnailInfoCache[layerUrl][objectId] = item;
                        this.updateThumbnail(item);
                    }));
                },
                clearThumbnails: function () {
                    this.thumbnailGraphicsLayer.clear();

                },
                updateThumbnail: function (thumbnailItem) {
                    if (this.thumbnailGraphicsLayer.graphics != null && this.thumbnailGraphicsLayer.graphics.length > 0) {
                        this.clearThumbnails();
                    }
                    /*
                     if (thumbnailItem.graphic != null) {
                     topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.REMOVE, thumbnailItem.graphic);
                     }
                     */
                    if (thumbnailItem.extent == null || thumbnailItem.thumbnailUrl == null) {
                        return;
                    }
                    var centerPoint = thumbnailItem.extent.getCenter();
                    var screenGeom = screenUtils.toScreenGeometry(this.map.extent, this.map.width, this.map.height, thumbnailItem.extent);
                    //  console.dir(screenGeom);

                    var screenWidth = Math.abs(screenGeom.xmax - screenGeom.xmin);
                    var screenHeight = Math.abs(screenGeom.ymax - screenGeom.ymin);
                    var symbol = new PictureMarkerSymbol(thumbnailItem.thumbnailUrl, screenWidth, screenHeight);
                    var graphic = new Graphic(centerPoint, symbol, {}, null);

                    this.thumbnailGraphicsLayer.add(graphic);
                    // topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.ADD, thumbnailItem.graphic);
                }
            });

    });
