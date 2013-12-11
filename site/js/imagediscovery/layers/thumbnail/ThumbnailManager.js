define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "esri/symbols/PictureMarkerSymbol",
    "esri/graphic",
    "esri/geometry/Extent",
    "esri/geometry/screenUtils",
    "esriviewer/base/DataLoaderSupport",
    "esri/layers/GraphicsLayer"

],
    function (declare, topic, lang, PictureMarkerSymbol, Graphic, Extent, screenUtils, DataLoaderSupport, GraphicsLayer) {
        return declare(
            [DataLoaderSupport],
            {
                constructor: function () {
                    this.thumbnailTokenCache = {};
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
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, clearGraphicsScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.SHOW, lang.hitch(this, this.handleShowThumbnail));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.CLEAR, clearGraphicsScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.RELOAD, lang.hitch(this, this.updateThumbnails));

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
                    var token = null;
                    if (this.thumbnailTokenCache[layerUrl] == null) {
                        var userObject = null;
                        topic.publish(VIEWER_GLOBALS.EVENTS.IDENTITY_MANAGER.GET_TOKEN, layerUrl, function (userObj) {
                            userObject = userObj;
                        });
                        if (userObject != null && lang.isObject(userObject)) {
                            this.thumbnailTokenCache[layerUrl] = userObject;
                        }
                        else {
                            this.thumbnailTokenCache[layerUrl] = {username: null, token: null};
                        }
                    }
                    if (this.thumbnailTokenCache[layerUrl].token != null) {
                        thumbnailUrl += "?token=" + this.thumbnailTokenCache[layerUrl].token;
                    }
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
                updateThumbnails: function () {
                    this.clearThumbnails();
                    for (var key in this.thumbnailInfoCache) {
                        var currentLayerItems = this.thumbnailInfoCache[key];
                        for (var key2 in currentLayerItems) {
                            var currentThumbnailItem = currentLayerItems[key2];
                            this.updateThumbnail(currentThumbnailItem, false);

                        }
                    }
                },
                updateThumbnail: function (thumbnailItem, clearGraphics) {
                    if (clearGraphics == null) {
                        clearGraphics = true;
                    }
                    if (clearGraphics && this.thumbnailGraphicsLayer.graphics != null && this.thumbnailGraphicsLayer.graphics.length > 0) {
                        this.clearThumbnails();
                    }

                    if (thumbnailItem.extent == null || thumbnailItem.thumbnailUrl == null) {
                        return;
                    }
                    var centerPoint = thumbnailItem.extent.getCenter();
                    var screenGeom = screenUtils.toScreenGeometry(this.map.extent, this.map.width, this.map.height, thumbnailItem.extent);

                    var screenWidth = Math.abs(screenGeom.xmax - screenGeom.xmin);
                    var screenHeight = Math.abs(screenGeom.ymax - screenGeom.ymin);
                    var symbol = new PictureMarkerSymbol(thumbnailItem.thumbnailUrl, screenWidth, screenHeight);
                    var graphic = new Graphic(centerPoint, symbol, {}, null);

                    this.thumbnailGraphicsLayer.add(graphic);
                }
            });

    })
;
