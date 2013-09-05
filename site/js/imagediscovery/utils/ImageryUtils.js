define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "esriviewer/base/DataLoaderSupport"
],
    function (declare, lang, topic, DataLoaderSupport) {
        return declare(
            [DataLoaderSupport],
            {
                constructor: function () {
                    this.queryControllerToIdLookup = {}
                },
                loadKeyProperties: function (layer, callback) {
                    //try to load the keyProperties
                    var wrappedCallback = lang.hitch(this, function (layer, keyProperites) {
                        layer.keyProperties = keyProperites;
                        callback(layer);
                    }, layer);
                    var wrappedErrback = lang.hitch(this, function () {
                        callback(layer);
                    }, layer);

                    var requestQuery = "?f=json";
                    if (layer.credential && layer.credential.token != null) {
                        requestQuery += "&token=" + layer.credential.token;
                    }
                    this.loadProxiedJson(layer.url + "/keyProperties" + requestQuery, wrappedCallback, wrappedErrback);

                },
                getKeyPropertiesForRaster: function (layer, id, callback, errback) {
                    var requestQuery = "?f=json";
                    if (layer.credential && layer.credential.token != null) {
                        requestQuery += "&token=" + layer.credential.token;
                    }
                    var rasterInfoUrl = VIEWER_UTILS.joinUrl(layer.url, id + "/info/keyProperties" + requestQuery);
                    this.loadProxiedJson(rasterInfoUrl, callback, errback);
                },
                sortItemsIntoQueryControllerArray: function (items) {
                    var queryControllerArray = [];
                    var controllerIdToItemLookup = [];
                    var currentItem;
                    for (var i = 0; i < items.length; i++) {
                        currentItem = items[i];
                        if (controllerIdToItemLookup[currentItem.queryControllerId] == null) {
                            var itemArray = [];
                            controllerIdToItemLookup[currentItem.queryControllerId] = itemArray;
                            if (this.queryControllerToIdLookup[currentItem.queryControllerId] == null) {
                                //populate the cache
                                this.getQueryLayerControllerFromId(currentItem.queryControllerId);
                            }
                            queryControllerArray.push({items: itemArray, queryController: this.queryControllerToIdLookup[currentItem.queryControllerId]});
                        }
                        controllerIdToItemLookup[currentItem.queryControllerId].push(currentItem);
                    }
                    return queryControllerArray;
                },
                getQueryLayerControllerFromItem: function (item) {
                    return this.getQueryLayerControllerFromId(item.queryControllerId);
                },
                getQueryLayerControllerFromId: function (queryLayerControllerId) {
                    if (this.queryControllerToIdLookup[queryLayerControllerId]) {
                        return this.queryControllerToIdLookup[queryLayerControllerId];
                    }
                    else {
                        var queryController;
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET_BY_ID, queryLayerControllerId, function (qCon) {
                            queryController = qCon;
                        });
                        this.queryControllerToIdLookup[queryLayerControllerId] = queryController;
                        return queryController;
                    }
                },
                layerSupportsDownload: function (layer) {
                    return (layer != null && layer.capabilities && layer.capabilities.toLowerCase().indexOf(("download")) > -1);

                },
                toUniqueValueArray: function (ary) {
                    var prim = {"boolean": {}, "number": {}, "string": {}}, obj = [];
                    return ary.filter(function (x) {
                        var t = typeof x;
                        return (t in prim) ?
                            !prim[t][x] && (prim[t][x] = 1) :
                            obj.indexOf(x) < 0 && obj.push(x);
                    });
                }

            });
    });