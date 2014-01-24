define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/Evented",
    "dojo/_base/Color",
    "dojo/_base/lang",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/graphic"
],
    function (declare, topic, Evented, Color, lang, GraphicsLayer, SimpleFillSymbol, SimpleLineSymbol, Graphic) {
        return declare(
            [Evented],
            {
                constructor: function () {
                    this.getVisibleFootprintsHandler = lang.hitch(this, this._getVisibleFootprintsHandler);

                    this.initSymbology();
                    this.initListeners();

                    //cache that stores all the footprints on the map (so that we can change symbology when highlighting)
                    //todo:      this.footprintGraphicsCache = {};
                    //cache that stores all footprints that are currently highlighted (so that we can remember to
                    //re-highlight them when zoomed back to appropriate level)
                    this.highlightedFootprintsCache = {};
                },
                initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.COMPLETE, lang.hitch(this, this.moveLayerToTop));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.clearResults));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_VISIBLE, lang.hitch(this, this.handleFootprintsLayerVisible));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.SET_FOOTPRINTS_LAYER_TRANSPARENT, lang.hitch(this, this.handleSetLayerTransparent));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.SET_FOOTPRINTS_LAYER_OPAQUE, lang.hitch(this, this.handleSetLayerOpaque));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.CENTER_AND_FLASH_FOOTPRINT, lang.hitch(this, this.centerAndFlashFootprint));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.REFRESH_FOOTPRINTS_LAYER, lang.hitch(this, this.reloadLayer));
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.DRAW.DRAW_GRAPHICS_LAYER_CREATED, lang.hitch(this, this.moveLayerToTop));
                },
                moveLayerToTop: function () {
                    if (this.footprintsLayer) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.MOVE_LAYER_TO_TOP, this.footprintsLayer);
                    }
                },
                loadViewerConfigurationData: function () {
                    var searchConfiguration = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "searchConfiguration", function (searchConf) {
                        searchConfiguration = searchConf;
                    });
                    if (searchConfiguration != null && lang.isObject(searchConfiguration)) {
                        if (searchConfiguration.footprintZoomLevelStart != null) {
                            this.footprintZoomLevelStart = searchConfiguration.footprintZoomLevelStart;
                        }
                    }

                },
                startup: function () {
                    this.createFootprintsLayer();
                },
                /**
                 * makes the footprints layer opaque
                 */
                handleSetLayerOpaque: function () {
                    this.footprintsLayer.setOpacity(1.0);
                },
                /**
                 * makes the footprints layer 100% transparent
                 */
                handleSetLayerTransparent: function () {
                    this.footprintsLayer.setOpacity(0);
                },
                /**
                 * returns true to the callback if the footprints layer is visible
                 * @param callback
                 */
                handleFootprintsLayerVisible: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.isVisible());
                    }
                },
                /**
                 * returns true if the footprint layer is visible
                 * @return {*}
                 */
                isVisible: function () {
                    return this.footprintsLayer.visible;
                },
                /**
                 * hides the footprints layer
                 */
                hideLayer: function () {
                    this.footprintsLayer.hide();

                },
                /**
                 * shows the footprints layer
                 */
                showLayer: function () {
                    this.reloadLayer();
                    this.footprintsLayer.show();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_DISPLAYED);

                },
                /**
                 * clears the footprints layer graphics. called when the discovery viewer results have been cleared
                 */
                clearResults: function () {
                    if (this.footprintsLayer) {
                        this.footprintsLayer.clear();
                    }
                },
                /**
                 * creates the footprints layer and adds it to the map
                 */
                createFootprintsLayer: function () {
                    this.footprintsLayer = new GraphicsLayer({displayOnPan: false});
              //todo: removed to implement map click      this.footprintsLayer.on("click", lang.hitch(this, this.handleLayerClick));
                    // this.footprintsLayer.on("click",lang.hitch(this,this.handleLayerClick));
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD_EXTERNAL_MANAGED_LAYER, this.footprintsLayer);
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.MOVE_LAYER_TO_TOP, this.footprintsLayer);
                    this.emit("footprintsLayerCreated");
                },

                handleLayerClick: function (evt) {
                    if (this.footprintsLayer && (this.footprintsLayer.opacity == null || this.footprintsLayer.opacity > 0)) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.SHOW_POPUP, evt.graphic.attributes, {x: evt.pageX, y: evt.pageY});
                    }
                },
                /**
                 * initializes the symbology for the footprints layer
                 */
                initSymbology: function () {
                    this.footprintPolygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([255, 0, 0]), 1), new Color([255, 255, 0, 0]));

                    this.highlightedFootprintPolygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([255, 255, 0]), 2), new Color([255, 0, 0, 0]));
                },
                /**
                 * called when a discovery viewer filter has been applied. reloads the footprints layer
                 */
                handleFilterApplied: function () {
                    if (this.footprintsLayer.visible) {
                        this.reloadLayer();
                    }
                },
                /**
                 * reloads the footprints layer
                 */
                reloadLayer: function () {
                    this.clearResults();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_FOOTPRINT_FEATURES_GROUPED_BY_QUERY_CONTROLLER, this.getVisibleFootprintsHandler);
                },
                /**
                 * called when the shopping cart toggles back to the footprints result view
                 */
                _getVisibleFootprintsHandler: function (queryControllersWithResultsLookup) {
                    //    return;
                    var cachedGraphicsCount = 0;
                    var currentGeometry;
                    var currentFeature;
                    var currentQueryLayerController;
                    var results;
                    var graphicsToLoad = {};
                    for (var key in queryControllersWithResultsLookup) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET_BY_ID, key, function (queryLayerCont) {
                            currentQueryLayerController = queryLayerCont;
                        });
                        results = queryControllersWithResultsLookup[key];
                        for (var i = 0; i < results.length; i++) {
                            currentFeature = results[i];
                            currentGeometry = currentFeature.geometry;
                            if (currentGeometry) {
                                cachedGraphicsCount++;
                                var graphic = new Graphic(currentGeometry, this.footprintPolygonSymbol);
                                graphic.attributes = currentFeature;
                                this.footprintsLayer.add(graphic);

                                //add footprint to cache
                                //todo:    var oid = currentFeature.OBJECTID;
                                //todo:   this.footprintGraphicsCache[oid] = graphic;
                            }
                            else {
                                var addToObj = graphicsToLoad[key];
                                if (addToObj == null) {
                                    addToObj = {results: [], queryLayerController: currentQueryLayerController, objectIds: [] };
                                    graphicsToLoad[key] = addToObj;
                                }
                                //    addArr.push(currentFeature[currentQueryLayerController.layer.objectIdField]);
                                addToObj.objectIds.push(currentFeature[currentQueryLayerController.layer.objectIdField]);
                                addToObj.results.push(currentFeature);
                            }
                        }
                    }
                    this._loadServerSideGeometries(graphicsToLoad);
                },
                _loadServerSideGeometries: function (resultsByQueryControllerId) {
                    var currentQueryLayerController;
                    var currentResults;
                    var currentObjectIds;
                    for (var key in resultsByQueryControllerId) {
                        currentQueryLayerController = resultsByQueryControllerId[key].queryLayerController;
                        currentResults = resultsByQueryControllerId[key].results;
                        currentObjectIds = resultsByQueryControllerId[key].objectIds;
                        currentQueryLayerController.queryForGeometriesFromObjectIds(currentObjectIds, lang.hitch(this, this.handleGeometriesResponse, currentResults, currentQueryLayerController))

                    }
                },
                handleGeometriesResponse: function (passedResults, queryLayerController, response) {
                    if (response && response.features) {
                        var processedResponseByObjectId = {};
                        var currentFeature;
                        var i;
                        //create a lookup of geometries by the features object id
                        for (i = 0; i < response.features.length; i++) {
                            currentFeature = response.features[i];
                            processedResponseByObjectId[currentFeature.attributes[queryLayerController.layer.objectIdField]] = currentFeature.geometry;
                        }
                        //loop through the passed results and set the geometry on the result feature
                        var currentResultObjectId;
                        var currentGeometry;
                        var addedGeometryCount = 0;
                        for (i = 0; i < passedResults.length; i++) {
                            currentResultObjectId = passedResults[i][queryLayerController.layer.objectIdField];
                            if (processedResponseByObjectId[currentResultObjectId] != null) {
                                passedResults[i].geometry = currentGeometry = processedResponseByObjectId[currentResultObjectId];
                                //add the currentGeometry to the graphics layer
                                addedGeometryCount++;
                                var graphic = new Graphic(currentGeometry, this.footprintPolygonSymbol);
                                graphic.attributes = passedResults[i];
                                this.footprintsLayer.add(graphic);

                                //add footprint to cache
                                //todo: var oid = currentFeature.OBJECTID;
                                //todo: this.footprintGraphicsCache[oid] = graphic;
                            }
                        }
                    }
                },
                /**
                 centers and flashes a result footprint on the footprints layer
                 */
                centerAndFlashFootprint: function (resultEntry) {
                    return;
                    /*
                     if (resultEntry != null) {
                     var graphic = this.footprintGraphicsCache[resultEntry.OBJECTID];
                     if (graphic) {
                     topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.CENTER_AND_FLASH, graphic);
                     }
                     }
                     */
                }
            });
    });
