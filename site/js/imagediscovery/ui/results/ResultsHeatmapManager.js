define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/Evented",
    "dojo/_base/lang",
    "../../layers/HeatmapLayer",
    "dojo/dom-construct",
    "dojo/_base/window"
],
    function (declare, topic, Evented,  lang, HeatmapLayer, domConstruct, window) {
        return declare(
            [Evented],
            {
                constructor: function () {
                    this.getVisibleFootprintsHandler = lang.hitch(this, this._getVisibleFootprintsHandler);
                    this.initListeners();
                },
                initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.clearResults));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.COMPLETE, lang.hitch(this, this.handleQueryComplete));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.APPLIED, lang.hitch(this, this.handleFilterApplied));
                },
                startup: function () {
                    this.createHeatmapLayer();
                },
                layerExists: function () {
                    return this.heatmapLayer != null;
                },
                isVisible: function () {
                    return this.heatmapLayer.visible;
                },
                hideLayer: function () {
                    this.heatmapLayer.hide();

                },
                showLayer: function () {
                    // this.reloadLayer();
                    this.heatmapLayer.show();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.CLUSTER_LAYER_DISPLAYED);
                },
                handleQueryComplete: function () {
                    this.heatmapLayer.setData(this.currentResultSet);
                },
                clearResults: function () {
                    this.destroyHeatmapLayer();
                },
                destroyHeatmapLayer: function () {
                    this.currentResultSet = [];
                    if (this.heatmapLayer) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.REMOVE_EXTERNAL_MANAGED_LAYER, this.heatmapLayer);
                        this.heatmapLayer.destroy();
                        this.heatmapLayer = null;
                        if (this.heatMapDiv) {
                            domConstruct.destroy(this.heatMapDiv);
                            this.heatMapDiv = null;
                        }
                    }
                },
                createHeatmapLayer: function () {
                    this.destroyHeatmapLayer();
                    var mapRef;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GET, function (responseMap) {
                        mapRef = responseMap;
                    });

                    this.heatMapDiv = domConstruct.create("div", {id: "heatMapLayer"});
                    domConstruct.place(this.heatMapDiv, window.body());
                    this.heatmapLayer = new HeatmapLayer({
                        config: {
                            "useLocalMaximum": false,
                            "radius": 40,
                            "gradient": {
                                0.45: "rgb(000,000,255)",
                                0.55: "rgb(000,255,255)",
                                0.65: "rgb(000,255,000)",
                                0.95: "rgb(255,255,000)",
                                1.00: "rgb(255,000,000)"
                            }
                        },
                        "map": mapRef,
                        "opacity": 0.85
                    }, this.heatMapDiv);
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD_EXTERNAL_MANAGED_LAYER, this.heatmapLayer);
                    this.emit("clusterLayerCreated");
                },
                addResults: function (results, queryLayerController) {
                    this.currentResultSet = [];
                    if (this.heatmapLayer == null) {
                        this.createHeatmapLayer();
                    }
                    if (results != null && results.features != null && lang.isArray(results.features)) {
                        var currentFeature;
                        var currentGeometry;
                        var currentExtent;
                        var currentCenterPoint;
                        for (var i = 0; i < results.features.length; i++) {
                            currentFeature = results.features[i];
                            currentGeometry = currentFeature.geometry;
                            currentExtent = currentGeometry.getExtent();

                            currentCenterPoint = currentExtent.getCenter();

                            this.currentResultSet.push({
                                attributes: {},
                                geometry: {
                                    x: currentCenterPoint.x,
                                    y: currentCenterPoint.y,
                                    spatialReference: currentCenterPoint.spatialReference
                                }
                            });
                        }
                    }
                },
                handleFilterApplied: function () {
                    if (this.heatmapLayer.visible) {
                        this.reloadLayer();
                    }
                },
                reloadLayer: function () {
                    this.clearResults();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_VISIBLE_FOOTPRINT_GEOMETRIES, this.getVisibleFootprintsHandler);
                },
                _getVisibleFootprintsHandler: function (footprints) {
                    this.createHeatmapLayer();
                    var currentCenter;
                    this.currentResultSet = [];
                    for (var i = 0; i < footprints.length; i++) {
                        currentCenter = footprints[i].getExtent().getCenter();
                        this.currentResultSet.push({
                            geometry: {
                                x: currentCenter.x,
                                y: currentCenter.y,
                                spatialReference: currentCenter.spatialReference
                            },
                            attributes: {}
                        });
                    }
                    this.heatmapLayer.setData(this.currentResultSet);
                    this.handleQueryComplete();
                }
            });
    });