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
                },
                initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.clearResults));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.APPLIED, lang.hitch(this, this.handleFilterApplied));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_VISIBLE, lang.hitch(this, this.handleFootprintsLayerVisible));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.SET_FOOTPRINTS_LAYER_TRANSPARENT, lang.hitch(this, this.handleSetLayerTransparent));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.SET_FOOTPRINTS_LAYER_OPAQUE, lang.hitch(this, this.handleSetLayerOpaque));
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

                },
                createFootprintsLayer: function () {
                    this.footprintsLayer = new GraphicsLayer();
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD_EXTERNAL_MANAGED_LAYER, this.footprintsLayer);
                    this.emit("footprintsLayerCreated");
                },
                initSymbology: function () {
                    this.footprintPolygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([255, 0, 0]), 1), new Color([255, 0, 0, 0]));
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
                            this.footprintsLayer.add(new Graphic(currentGeometry, this.footprintPolygonSymbol));
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
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_FOOTPRINT_GEOMETRIES, this.getVisibleFootprintsHandler);
                },
                _getVisibleFootprintsHandler: function (footprints) {
                    var currentGeometry;
                    for (var i = 0; i < footprints.length; i++) {
                        currentGeometry = footprints[i];
                        this.footprintsLayer.add(new Graphic(currentGeometry, this.footprintPolygonSymbol));
                    }
                }
            });

    })
;