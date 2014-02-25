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
    "esri/renderers/ClassBreaksRenderer"
],
    function (declare, topic, Evented, Color, lang, ClusterLayer, SimpleMarkerSymbol, SimpleLineSymbol, PictureMarkerSymbol, Graphic, ClassBreaksRenderer) {
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
                /**
                 * returns true if the cluster layer exists in the cluster manager
                 * @return {boolean}
                 */
                layerExists: function () {
                    return this.clusterLayer != null;
                },
                /**
                 * returns true if the cluster layer is visible
                 * @return {*}
                 */
                isVisible: function () {
                    if (this.clusterLayer) {
                        return this.clusterLayer.visible;
                    }
                    return false;
                },
                /**
                 hides the cluster layer

                 */
                hideLayer: function () {
                    if (this.clusterLayer) {
                        this.clusterLayer.hide();
                    }
                },
                /**
                 * displays the cluster layer on the map
                 */
                showLayer: function () {
                    this.reloadLayer();
                    this.clusterLayer.show();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.CLUSTER_LAYER_DISPLAYED);
                },
                /**
                 * called when a discovery viewer query is complete
                 */
                handleQueryComplete: function () {
                    if (this.clusterLayer) {
                        this.clusterLayer.clear();
                        this.clusterLayer._clusterGraphics();
                    }
                },
                /**
                 * called when results are cleared. destroys the cluster layer
                 */
                clearResults: function () {
                    this.destroyClusterLayer();
                },
                /**
                 * destroys the cluster layer
                 */
                destroyClusterLayer: function () {
                    if (this.clusterLayer) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.REMOVE_EXTERNAL_MANAGED_LAYER, this.clusterLayer);
                        this.clusterLayer = null;
                    }
                },
                /**
                 * creates the cluster layer and adds it to the map
                 */
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
                /**
                 * initializes the symbology for the cluster layer
                 */
                initSymbology: function () {
                    this.pointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_X, 1,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color("blue")));
                },
                /**
                 * adds results to the cluster layer
                 * @param results
                 * @param queryLayerController
                 */
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
                /**
                 * called when a discovery viewer filter has been applied. reloads the cluster layer
                 */
                handleFilterApplied: function () {
                    if (this.clusterLayer && this.clusterLayer.visible) {
                        this.reloadLayer();
                    }
                },
                /**
                 * reloads the cluster layer
                 */
                reloadLayer: function () {
                    this.clearResults();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_FOOTPRINT_GEOMETRIES, this.getVisibleFootprintsHandler);
                },
                /**
                 * adds passed footprints to the cluster layer
                 * @param footprints
                 * @private
                 */
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