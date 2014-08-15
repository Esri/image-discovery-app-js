//borrowed from: https://github.com/Esri/swipe-map-storytelling-template-js

define([
        "dojo/_base/declare",
        "dojo/text!./template/SwipeWidgetTemplate.html",
        //  "xstyle/css!./theme/SwipeWidgetTheme.css",
        "esri/layers/ArcGISImageServiceLayer",
        "dojo/topic",
        "dojo/_base/lang",
        "dojo/sniff",
        "dojo/dom",
        "esriviewer/ui/base/UITemplatedWidget",
        "./model/SwipeViewModel",
        "dojo/dnd/move",
        "dojo/_base/connect",
        "dojo/dom-construct",
        "dojo/_base/array",
        "dojo/dom-style",
        "dijit/form/Button"
    ],
    //  function (declare, template, theme, topic, lang, sniff, dom,  UITemplatedWidget, SwipeViewModel, Move, con, domConstruct, domStyle, Button) {
    function (declare, template, ArcGISImageServiceLayer, topic, lang, sniff, dom, UITemplatedWidget, SwipeViewModel, Move, con, domConstruct, array, domStyle, Button) {
        return declare(
            [UITemplatedWidget],
            {
                chooseSwipeLevel: "2",
                templateString: template,
                postCreate: function () {
                    this.inherited(arguments);
                    this.createSwipeDiv();
                    //get a map reference
                    var mapRef;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GET, function (responseMap) {
                        mapRef = responseMap;
                    });
                    this.map = mapRef;
                    this.currentlyVisibleOperLayers = [];
                    this.currentlySelectedBasemapLayers = null;
                    this.currentlySelectedBasemapURL = null;
                    this.viewModel = new SwipeViewModel();
                    this.populateLayerList();
                    this.handleImageryLayersVisible();
                    ko.applyBindings(this.viewModel, this.domNode);
                },

                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_DISPLAYED, lang.hitch(this, this.handleImageryLayersVisible));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.CLUSTER_LAYER_DISPLAYED, lang.hitch(this, this.handleImageryLayersHidden));
                },
                createSwipeDiv: function () {
                    this.sliderDiv = domConstruct.create("div", {className: "swipeSlider", title: "Move the slider left or right"});
                    var mapDiv;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GET_MAP_DIV, function (mD) {
                        mapDiv = mD;
                    });
                    domConstruct.place(this.sliderDiv, mapDiv);
                },
                loadViewerConfigurationData: function () {

                },
                validateLayerChoices: function () {
                    if (this.viewModel.useRefLayer() &&
                        this.viewModel.selectedSwipeLayerId() == this.viewModel.selectedRefLayerId()) {
                        alert("The reference layer cannot be the same as the swipe layer.");
                        return false;
                    }
                    return true;
                },
                startSwipe: function () {
                    if (!this.validateLayerChoices()) return;

                    this.initSwipe();
                    if (this.swipeLayerId === undefined || this.swipeLayerId == "") {
                        return;
                    }
                    this.swipeSlider = new Move.parentConstrainedMoveable(this.sliderDiv, {
                        area: "content",
                        within: true
                    });

                    domStyle.set(this.swipeSlider.node, "height", this.map.height + "px");
                    domStyle.set(this.swipeSlider.node, "top", "0");
                    domStyle.set(this.swipeSlider.node, "left", ((this.map.width / 2) - 4) + "px");
                    this.clipValue = ((this.map.width / 2) - 4);
                    //Just a check, should not call this function here
                    if (this.swipeDiv != null)
                        this.clearClip();
                    if (this.swipeLayerId == null || this.swipeLayerId == "") {
                        return;
                    }
                    this.clipLayer(this.swipeLayerId);
                },
                clipLayer: function (layerid) {
                    //Initial swipe slider location
                    this.swipe(domStyle.get(this.sliderDiv, "left"));
                    //Make the slider visible
                    domStyle.set(this.sliderDiv, "display", "");
                    this.swipeConnect = con.connect(this.swipeSlider, 'onMove', lang.hitch(this, function (args) {
                        domStyle.set(this.swipeSlider.node, "top", "0");
                        var left = parseInt(domStyle.get(this.swipeSlider.node, "left"), 10);
                        if (left <= 0 || left >= (this.map.width)) return;
                        this.clipValue = domStyle.get(this.swipeSlider.node, "left");
                        this.swipe(this.clipValue);
                    }));
                    this.panEndConnect = con.connect(this.map, 'onPanEnd', lang.hitch(this, function (args) {
                        this.swipe(this.clipValue);
                    }));

                    if (this.map.navigationMode === "css-transforms") {
                        this.panConnect = con.connect(this.map, 'onPan', lang.hitch(this, function (args) {
                            this.swipe(this.clipValue);
                        }));
                    }
                },
                clearClip: function () {
                    if (this.swipeDiv != null) {
                        this.swipeDiv.style.clip = sniff("ie") ? "rect(auto auto auto auto)" : "";
                    }
                },
                swipe: function (val) {
                    if (this.swipeDiv != null) {
                        var offset_left = parseFloat(this.swipeDiv.style.left);
                        var offset_top = parseFloat(this.swipeDiv.style.top);
                        var rightval, leftval, topval, bottomval;

                        if (offset_left > 0) {
                            rightval = parseFloat(val) - Math.abs(offset_left);
                            leftval = -(offset_left);
                        }
                        else if (offset_left < 0) {
                            leftval = 0;
                            rightval = parseFloat(val) + Math.abs(offset_left);
                        }
                        else {
                            leftval = 0;
                            rightval = parseFloat(val);
                        }
                        if (offset_top > 0) {
                            topval = -(offset_top);
                            bottomval = this.map.height - offset_top;
                        }
                        else if (offset_top < 0) {
                            topval = 0;
                            bottomval = this.map.height + Math.abs(offset_top);
                        }
                        else {
                            topval = 0;
                            bottomval = this.map.height;
                        }
                        // If CSS Transformation is applied to the layer (i.e. this.swipeDiv),
                        // record the amount of translation and adjust clip rect
                        // accordingly
                        var tx = 0, ty = 0;
                        if (this.map.navigationMode === "css-transforms") {
                            var prefix = "";
                            if (sniff("webkit")) {
                                prefix = "-webkit-";
                            }
                            if (sniff("ff")) {
                                prefix = "-moz-";
                            }
                            if (sniff("ie")) {
                                prefix = "-ms-";
                            }
                            if (sniff("opera")) {
                                prefix = "-o-";
                            }

                            var transformValue = this.swipeDiv.style.getPropertyValue(prefix + "transform");
                            if (transformValue) {
                                if (transformValue.toLowerCase().indexOf("translate3d") !== -1) {
                                    transformValue = transformValue.replace("translate3d(", "").replace(")", "").replace(/px/ig, "").replace(/\s/i, "").split(",");
                                }
                                else if (transformValue.toLowerCase().indexOf("translate") !== -1) {
                                    transformValue = transformValue.replace("translate(", "").replace(")", "").replace(/px/ig, "").replace(/\s/i, "").split(",");
                                }
                                try {
                                    tx = parseFloat(transformValue[0]);
                                    ty = parseFloat(transformValue[1]);
                                } catch (e) {
                                }

                                leftval -= tx;
                                rightval -= tx;
                                topval -= ty;
                                bottomval -= ty;
                            }
                        }
                        this.swipeDiv.style.clip = "rect(" + topval + "px " + rightval + "px " + bottomval + "px " + leftval + "px)";
                    }
                },
                //This is called when "Stop Swipe" button is clicked
                stopSwipe: function () {
                    this.map.showZoomSlider();
                    this.swipeSlider = null;
                    domStyle.set(this.sliderDiv, "display", "none");
                    if (this.swipeConnect)
                        con.disconnect(this.swipeConnect);
                    if (this.panEndConnect)
                        con.disconnect(this.panEndConnect);
                    if (this.panConnect)
                        con.disconnect(this.panConnect);
                    if (this.swipeDiv != null) {
                        this.swipeDiv.style.clip = sniff("ie") ? "rect(auto auto auto auto)" : "";
                        this.swipeDiv = null;
                    }
                    //Turn layers back on
                    if (this.viewModel.useRefLayer()) {
                        if (this.currentlyVisibleOperLayers != null) {
                            for (var i = 0; i < this.currentlyVisibleOperLayers.length; i++) {
                                topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.MAKE_VISIBLE, this.currentlyVisibleOperLayers[i]);
                            }
                            this.currentlyVisibleOperLayers = [];
                        }
                        if (this.currentlySelectedBasemapLayers != null) {
                            this.toggleBaseMap(true);
                            this.currentlySelectedBasemapLayers = null;
                        }
                        if (this.currentlySelectedBasemapURL != null) {
                            this.toggleBaseMap(true);
                            this.currentlySelectedBasemapURL = null;
                        }
                    }
                },
                turnOffOperationalLayers: function (opLayers) {
                    for (var i = 0; i < opLayers.length; i++) {
                        if (opLayers[i].visible) {
                            this.currentlyVisibleOperLayers.push(opLayers[i]);
                            topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.MAKE_INVISIBLE, opLayers[i]);
                        }
                    }
                },
                initSwipe: function () {
                    var chooseLayer = this.chooseSwipeLevel;
                    this.swipeLayerId = this.viewModel.selectedSwipeLayerId();
                    //Turn off operational layers and basemap
                    if (this.viewModel.useRefLayer()) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.OPERATIONAL.GET, lang.hitch(this, this.turnOffOperationalLayers));

                        //Turn off basemap
                        //1st case: map is using base map gallery from ArcGIS JS API
                        var currentlySelectedBasemapLayers = null;
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.BASEMAP.GET_CURRENT, lang.hitch(this, function (currentBaseMap) {
                            if (currentBaseMap != null && currentBaseMap.layers != null && currentBaseMap.layers.length > 0) {
                                currentlySelectedBasemapLayers = currentBaseMap.layers;  //array of BaseMapLayer objects
                            }
                        }));
                        if (currentlySelectedBasemapLayers != null) {
                            //save to instance variable for later use
                            this.currentlySelectedBasemapLayers = currentlySelectedBasemapLayers;
                            this.toggleBaseMap(false);
                        }
                        else {
                            //2nd case: map is using our own base map gallery
                            var currentlySelectedBasemapURL = null;
                            topic.publish(VIEWER_GLOBALS.EVENTS.MAP.BASEMAP.GET_CURRENT_URL, lang.hitch(this, function (currentBaseMapURL) {
                                if (currentBaseMapURL != null && currentBaseMapURL.length > 0) {
                                    currentlySelectedBasemapURL = currentBaseMapURL;  //string
                                }
                            }));
                            if (currentlySelectedBasemapURL != null) {
                                this.currentlySelectedBasemapURL = currentlySelectedBasemapURL;
                                this.toggleBaseMap(false);
                            }
                        }
                    }

                    this.clipValue = this.map.width;
                    this.swipeDiv = null;
                    if (this.swipeLayerId == this.map.graphics.id) {
                        //this.map.graphics._div.parent.rawNode.id
                        this.swipeDiv = dom.byId(this.map.container.id + "_gc");
                    }
                    else {
                        var layer = this.map.getLayer(this.swipeLayerId);
                        if (layer == null || layer == undefined) {
                            return;
                        }
                        //Move the target layer to be on top
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.MOVE_LAYER_TO_TOP, layer);

                        this.swipeDiv = layer._div;
                    }
                    if (this.swipeDiv === undefined) {
                        return;
                    }
                    if (this.swipeDiv.style === undefined) {
                        return;
                    }
                },
                toggleBaseMap: function (show) {
                    array.forEach(this.map.layerIds, dojo.hitch(this, function (id) {
                        var layer = this.map.getLayer(id); //layer is a Layer object
                        var layerURL = layer.url;

                        //Loop through this.currentlySelectedBasemapLayers, which is an array of BaseMapLayer objects
                        //Cannot compare objects directly due to different types, use "url" attribute to do comparison
                        if (this.currentlySelectedBasemapLayers != null) {
                            for (var i = 0; i < this.currentlySelectedBasemapLayers.length; i++) {
                                var basemapLayer = this.currentlySelectedBasemapLayers[i];
                                if (layerURL == basemapLayer.url) {
                                    if (show) {
                                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.MAKE_VISIBLE, layer);
                                    }
                                    else {
                                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.MAKE_INVISIBLE, layer);
                                    }
                                }
                            }
                        }
                        else if (this.currentlySelectedBasemapURL != null) {
                            if (layerURL == this.currentlySelectedBasemapURL) {
                                if (show) {
                                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.MAKE_VISIBLE, layer);
                                }
                                else {
                                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.MAKE_INVISIBLE, layer);
                                }
                            }
                        }
                    }));
                },
                populateLayerList: function () {
                    var i, currLayerId;
                    var mapLayer;
                    var addedLayerIds = {};
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, lang.hitch(this, function (queryLayerControllers) {
                        var currLayer;
                        for (i = 0; i < queryLayerControllers.length; i++) {
                            currLayer = queryLayerControllers[i].layer;
                            var item = {
                                label: currLayer.searchServiceLabel ? currLayer.searchServiceLabel : currLayer.name,
                                id: currLayer.id
                            };
                            addedLayerIds[currLayer.id] = true;
                            this.viewModel.swipeLayers.push(item);
                        }
                    }));
                    if (this.map && this.map.layerIds) {
                        for (i = 0; i < this.map.layerIds.length; i++) {
                            currLayerId = this.map.layerIds[i];
                            if (!addedLayerIds[currLayerId]) {
                                mapLayer = this.map.getLayer(currLayerId);
                                if (mapLayer instanceof ArcGISImageServiceLayer) {
                                    addedLayerIds[currLayerId] = true;
                                    var item = {
                                        label: mapLayer.name,
                                        id: currLayerId
                                    };
                                    this.viewModel.swipeLayers.push(item);
                                }
                            }
                        }

                    }

                },
                handleImageryLayersVisible: function () {
                    this.viewModel.swipeEnbled(true);
                    this.viewModel.swipeDisabledMessage("");
                },
                handleImageryLayersHidden: function () {
                    this.stopSwipe();
                    this.viewModel.swipeEnbled(false);
                    this.viewModel.swipeDisabledMessage("Cannot swipe. Imagery is not visible")

                }

            });
    });
