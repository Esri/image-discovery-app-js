define([
        "dojo/_base/declare",
        "dojo/topic",
        "dojo/_base/lang",
        "esri/graphic",
        "esriviewer/base/DataLoaderSupport",
        "esri/layers/GraphicsLayer",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "dojo/_base/Color"

    ],
    function (declare, topic, lang,  Graphic,   DataLoaderSupport, GraphicsLayer,SimpleFillSymbol,SimpleLineSymbol,Color) {
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
                    this._initSymbology();
                    this.initListeners();


                },
                _initSymbology: function () {
                    //setup custom symbol
                    this.highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([223, 0, 0]), 2), new Color([255, 0, 0, 0]));
                    this.defaultSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([0, 0, 255]), 1), new Color([255, 0, 0, 0]));
                    this.shadedSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color([192, 192, 192]), 1), new Color([192, 192, 192, 0.4]));
                },
                initListeners: function () {
                    var clearGraphicsScoped = lang.hitch(this, this.clearThumbnails);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, clearGraphicsScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.SHOW, lang.hitch(this, this.handleShowThumbnail));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.THUMBNAIL.CLEAR, clearGraphicsScoped);

                },
                handleShowThumbnail: function (feature, layerUrl) {
                    this.clearThumbnails();
                    if (feature) {
                        if (feature.geometry) {
                            var graphic, intersectGeometry, geometry = feature.geometry;
                            graphic = new Graphic(geometry, this.shadedSymbol, feature.attributes);
                            this.thumbnailGraphicsLayer.add(graphic);
                        }
                    }
                },
                clearThumbnails: function () {
                    if (this.thumbnailGraphicsLayer) {
                        this.thumbnailGraphicsLayer.clear();
                    }
                }
            });

    })
;
