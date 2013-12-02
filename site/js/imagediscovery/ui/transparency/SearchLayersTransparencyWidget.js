//borrowed from: https://github.com/Esri/swipe-map-storytelling-template-js

define([
    "dojo/_base/declare",
    "dojo/text!./template/SearchLayersTransparencyWidget.html",
  //  "xstyle/css!./theme/TransparencySliderWidgetTheme.css",
    "dojo/topic",
    "dojo/on",
    "dojo/_base/lang",
    "esriviewer/ui/base/UITemplatedWidget",
    "dojo/dom-construct",
    "./SearchLayerSliderWidget"
],
 //   function (declare, template, theme, topic, on, lang, UITemplatedWidget, domConstruct, SearchLayerSliderWidget) {
    function (declare, template,  topic, on, lang, UITemplatedWidget, domConstruct, SearchLayerSliderWidget) {
        return declare(
            [UITemplatedWidget],
            {
                templateString: template,
                constructor: function () {
                    this.sliderCache = {};
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.addCloseButton();
                    this.populateSearchSliderList();
                },
                addCloseButton: function () {
                    var closeButton = domConstruct.create("div",
                        {title: "Close", className: "transparencyWidgetPopupCloseIcon windowAction close"});
                    domConstruct.place(closeButton, this.searchLayersTransparencyContentHeader);
                    on(closeButton, "click", lang.hitch(this, this.handleCloseWidget));
                },
                populateSearchSliderList: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, lang.hitch(this, function (queryLayerControllers) {
                        var currLayer;
                        var currQueryController;
                        for (var i = 0; i < queryLayerControllers.length; i++) {
                            currQueryController = queryLayerControllers[i];
                            currLayer = currQueryController.layer;
                            if (this.sliderCache[currLayer.id] == null) {
                                var sliderWidget = new SearchLayerSliderWidget({layer: currLayer, label: currQueryController.label});
                                this.sliderCache[currLayer.id] = sliderWidget;
                                domConstruct.place(sliderWidget.domNode, this.searchLayersTransparencySliderContent);
                            }
                        }
                    }));
                },
                handleCloseWidget: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.TRANSPARENCY.POPUP.HIDE);
                }
            });
    });
