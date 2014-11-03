define([
        "dojo/_base/declare",
        "dojo/topic",
        "dojo/dom-style",
        "dojo/_base/lang",
        "dojo/window",
        "./ImageryTimeSlider",
        "esriviewer/ui/window/WindowWidget"
    ],
    function (declare, topic, domStyle, lang, window, ImageryTimeSlider,WindowWidget) {
        return declare(
            [WindowWidget],
            {
                defaultPositioning: {
                    x: 700,
                    y: 50
                },
                windowWidth: "450px",
                windowHeaderText: "Imagery Time Slider",
                windowIconAltText: "Imagery Time Slider",
                windowIconClass: "commonIcons16 clock",
                positioningParamName: "imageryTime",
                initListeners: function () {
                    this.inherited(arguments);
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.TIME.WINDOW.SHOW, lang.hitch(this, this.show)));
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.TIME.WINDOW.HIDE, lang.hitch(this, this.hide)));
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.TIME.WINDOW.TOGGLE, lang.hitch(this, this.toggle)));
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.hide)));
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.DISPLAYED, lang.hitch(this, this.hide)));
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.CLUSTER_LAYER_DISPLAYED, lang.hitch(this, this.hide)));
                },
                postCreate: function () {
                    var windowBox = window.getBox();
                    if (windowBox.w > 1600) {
                        //make the window smaller
                        domStyle.set(this.domNode, "width", "25%");
                    }
                    else {
                        domStyle.set(this.domNode, "width", "35%");
                    }

                    this.inherited(arguments);
                    this.imageryTimeSlider = new ImageryTimeSlider();
                    this.setContent(this.imageryTimeSlider.domNode);

                },

                show: function () {
                    this.inherited(arguments);
                    if (this.imageryTimeSlider) {
                        var noSourcesLocked = true;
                        topic.publish(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.HAS_NO_SOURCES_LOCKED, function (noSourcesLk) {
                            noSourcesLocked = noSourcesLk;
                        });
                        if (!noSourcesLocked) {
                            topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_VISIBLE, lang.hitch(this, function (footprintsVis) {
                                noSourcesLocked = !footprintsVis;
                            }));
                        }
                        if (noSourcesLocked) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There are no visible thumbnails");
                            this.hide();
                        }
                        else {
                            this.imageryTimeSlider.show();
                            this.imageryTimeSlider.enable();
                        }

                    }

                },
                hide: function () {
                    this.inherited(arguments);
                    if (this.imageryTimeSlider) {
                        this.imageryTimeSlider.disable();
                        this.imageryTimeSlider.hide();

                    }

                }
            })
    })
;
