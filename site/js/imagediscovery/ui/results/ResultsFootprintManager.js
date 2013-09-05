define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/Evented",
    "dojo/_base/Color",
    "dojo/_base/lang",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/graphic",
    "dojo/_base/connect"
],
    function (declare, topic, Evented, Color, lang, GraphicsLayer, SimpleFillSymbol, SimpleLineSymbol, PictureMarkerSymbol, Graphic, con) {
        return declare(
            [Evented],
            {
                constructor: function () {
                    this.getVisibleFootprintsHandler = lang.hitch(this, this._getVisibleFootprintsHandler);
                    this.initSymbology();
                    this.initListeners();

                    //cache that stores all the footprints on the map (so that we can change symbology when highlighting)
                    this.footprintGraphicsCache = {};
                    //cache that stores all footprints that are currently highlighted (so that we can remember to
                    //re-highlight them when zoomed back to appropriate level)
                    this.highlightedFootprintsCache = {};
                },
                initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.clearResults));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.APPLIED, lang.hitch(this, this.handleFilterApplied));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_VISIBLE, lang.hitch(this, this.handleFootprintsLayerVisible));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.SET_FOOTPRINTS_LAYER_TRANSPARENT, lang.hitch(this, this.handleSetLayerTransparent));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.SET_FOOTPRINTS_LAYER_OPAQUE, lang.hitch(this, this.handleSetLayerOpaque));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.HIGHLIGHT_FOOTPRINT, lang.hitch(this, this.highlightFootprint));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.UNHIGHLIGHT_FOOTPRINT, lang.hitch(this, this.unhighlightFootprint));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.CENTER_AND_FLASH_FOOTPRINT, lang.hitch(this, this.centerAndFlashFootprint));
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
                handleSetLayerOpaque: function () {
                    this.footprintsLayer.setOpacity(1.0);
                },
                handleSetLayerTransparent: function () {
                    this.footprintsLayer.setOpacity(0);
                },
                handleFootprintsLayerVisible: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        callback(this.isVisible());
                    }
                },
                isVisible: function () {
                    return this.footprintsLayer.visible;
                },
                hideLayer: function () {
                    this.footprintsLayer.hide();

                },
                showLayer: function () {
                    this.reloadLayer();
                    this.footprintsLayer.show();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_DISPLAYED);

                },
                clearResults: function () {
                    this.footprintsLayer.clear();
                    //this.footprintGraphicsCache = {};
                },
                createFootprintsLayer: function () {
                    this.footprintsLayer = new GraphicsLayer({displayOnPan: false});
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD_EXTERNAL_MANAGED_LAYER, this.footprintsLayer);
                    this.emit("footprintsLayerCreated");
                },
                initSymbology: function () {
                    this.footprintPolygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([255, 0, 0]), 1), new Color([255, 0, 0, 0]));

                    this.highlightedFootprintPolygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([255, 255, 0]), 2), new Color([255, 0, 0, 0]));
                },
                addResults: function (results, queryLayerController) {
                    if (!this.footprintsLayer.visible) {
                        return;
                    }
                    if (results != null && results.features != null && lang.isArray(results.features)) {
                        var currentFeature;
                        var currentGeometry;
                        for (var i = 0; i < results.features.length; i++) {
                            currentFeature = results.features[i];
                            currentGeometry = currentFeature.geometry;

                            var graphic = new Graphic(currentGeometry, this.footprintPolygonSymbol);
                            this.footprintsLayer.add(graphic);

                            //add footprint to cache
                            var oid = currentFeature.attributes["OBJECTID"];
                            this.footprintGraphicsCache[oid] = graphic;
                        }
                    }
                },
                handleFilterApplied: function () {
                    if (this.footprintsLayer.visible) {
                        this.reloadLayer();
                    }
                },
                reloadLayer: function () {
                    this.clearResults();
                    //topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_FOOTPRINT_GEOMETRIES, this.getVisibleFootprintsHandler);
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_FOOTPRINT_FEATURES, this.getVisibleFootprintsHandler);
                },
                _getVisibleFootprintsHandler: function (footprintFeatures) {
                    var currentGeometry;
                    var currentFeature;
                    for (var i = 0; i < footprintFeatures.length; i++) {
                        currentFeature = footprintFeatures[i];
                        currentGeometry = currentFeature.geometry;
                        var graphic = new Graphic(currentGeometry, this.footprintPolygonSymbol);
                        this.footprintsLayer.add(graphic);

                        //add footprint to cache
                        var oid = currentFeature.OBJECTID;
                        this.footprintGraphicsCache[oid] = graphic;

                        //re-highlight footprint if needed
                        if (this.highlightedFootprintsCache[oid] &&
                            this.highlightedFootprintsCache[oid] == true) {
                            this.highlightFootprint(oid);
                        }
                    }
                },
                //highlights a single footprint (the footprint should be visible already)
                highlightFootprint: function (featureObjID) {
                    if (this.footprintGraphicsCache[featureObjID]) {
                        this.footprintGraphicsCache[featureObjID].symbol = this.highlightedFootprintPolygonSymbol;
                        this.highlightedFootprintsCache[featureObjID] = true;
                        this.footprintsLayer.redraw();
                    }
                },
                //removes highlights a single footprint (the footprint should be visible already)
                unhighlightFootprint: function (featureObjID) {
                    if (this.footprintGraphicsCache[featureObjID]) {
                        this.footprintGraphicsCache[featureObjID].symbol = this.footprintPolygonSymbol;
                        delete this.highlightedFootprintsCache[featureObjID];
                        this.footprintsLayer.redraw();
                    }
                },
                centerAndFlashFootprint: function (resultEntry) {
                    if (resultEntry != null) {
                        var graphic = this.footprintGraphicsCache[resultEntry.OBJECTID];
                        if (graphic) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.CENTER_AND_FLASH, graphic);
                        }
                    }
                }
            });
    });
