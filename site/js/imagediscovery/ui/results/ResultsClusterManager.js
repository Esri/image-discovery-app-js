define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/Evented",
    "dojo/_base/Color",
    "dojo/_base/lang",
    "../../layers/ClusterLayer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/graphic",
    "esri/renderers/ClassBreaksRenderer",
    "dojo/_base/connect"
],
    function (declare, topic, Evented, Color, lang, ClusterLayer, SimpleMarkerSymbol, SimpleLineSymbol, PictureMarkerSymbol, Graphic, ClassBreaksRenderer, con) {
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
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.COMPLETE, lang.hitch(this, this.handleQueryComplete));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.APPLIED, lang.hitch(this, this.handleFilterApplied));
                },
                startup: function () {
                    this.createClusterLayer();
                },

                layerExists: function () {
                    return this.clusterLayer != null;
                },
                isVisible: function () {
                    return this.clusterLayer.visible;
                },
                hideLayer: function () {
                    this.clusterLayer.hide();
                },
                showLayer: function () {
                    this.reloadLayer();
                    this.clusterLayer.show();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.CLUSTER_LAYER_DISPLAYED);
                },
                handleQueryComplete: function () {
                    this.clusterLayer.clear();
                    this.clusterLayer._clusterGraphics();
                },
                clearResults: function () {
                    this.destroyClusterLayer();
                },
                destroyClusterLayer: function () {
                    if (this.clusterLayer) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.REMOVE_EXTERNAL_MANAGED_LAYER, this.clusterLayer);
                        this.clusterLayer = null;
                    }
                },
                createClusterLayer: function () {
                    this.destroyClusterLayer();
                    this.clusterLayer = new ClusterLayer({
                        distance: 100,
                        id: "clusters",
                        "labelColor": "#fff",
                        "labelOffset": 10,
                        singleColor: "#888"
                    });
                    this.classBreaksRenderer = new ClassBreaksRenderer(this.pointSymbol, "clusterCount");

                    var blue = new PictureMarkerSymbol("images/symbols/BluePin1LargeB.png", 32, 32).setOffset(0, 15);
                    var green = new PictureMarkerSymbol("images/symbols/GreenPin1LargeB.png", 64, 64).setOffset(0, 15);
                    var red = new PictureMarkerSymbol("images/symbols/RedPin1LargeB.png", 72, 72).setOffset(0, 15);
                    this.classBreaksRenderer.addBreak(0, 2, blue);
                    this.classBreaksRenderer.addBreak(2, 200, green);
                    this.classBreaksRenderer.addBreak(200, 1001, red);
                    this.clusterLayer.setRenderer(this.classBreaksRenderer);


                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD_EXTERNAL_MANAGED_LAYER, this.clusterLayer);
                    this.emit("clusterLayerCreated");
                },
                initSymbology: function () {
                    this.pointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_X, 1,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color("blue")));
                },
                addResults: function (results, queryLayerController) {
                    if (this.clusterLayer == null) {
                        this.createClusterLayer();
                    }
                    if (results != null && results.features != null && lang.isArray(results.features)) {
                        var currentFeature;
                        var currentGeometry;
                        var currentExtent;
                        var currentCenterPoint;
                        var currentGraphic;
                        for (var i = 0; i < results.features.length; i++) {
                            currentFeature = results.features[i];
                            currentGeometry = currentFeature.geometry;
                            currentExtent = currentGeometry.getExtent();
                            currentCenterPoint = currentExtent.getCenter();
                            currentGraphic = new Graphic(currentCenterPoint, this.pointSymbol);
                            this.clusterLayer.add({
                                x: currentCenterPoint.x,
                                y: currentCenterPoint.y,
                                attributes: {}
                            });
                        }
                    }
                },
                handleFilterApplied: function () {
                    if (this.clusterLayer.visible) {
                        this.reloadLayer();
                    }
                },
                reloadLayer: function () {
                    this.clearResults();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_FOOTPRINT_GEOMETRIES, this.getVisibleFootprintsHandler);
                },
                _getVisibleFootprintsHandler: function (footprints) {
                    this.createClusterLayer();
                    var currentCenter;
                    for (var i = 0; i < footprints.length; i++) {
                        currentCenter = footprints[i].getExtent().getCenter();
                        this.clusterLayer.add({
                            x: currentCenter.x,
                            y: currentCenter.y,
                            attributes: {}
                        });
                    }
                    this.handleQueryComplete();
                }

            });
    });