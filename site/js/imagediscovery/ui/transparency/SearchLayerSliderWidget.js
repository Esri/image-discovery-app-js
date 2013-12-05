//borrowed from: https://github.com/Esri/swipe-map-storytelling-template-js

define([
    "dojo/_base/declare",
    "dojo/text!./template/SearchLayerSliderTemplate.html",
    "dojo/_base/lang",
    "esriviewer/ui/base/UITemplatedWidget",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "./model/SearchLayerSliderViewModel"
],
    function (declare, template, lang, UITemplatedWidget, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, SearchLayerSliderViewModel) {
        return declare(
            [UITemplatedWidget],
            {
                label: "Layer",
                templateString: template,
                constructor: function (params) {
                    this.layer = null;
                    lang.mixin(this, params || {});
                    this.sliderCache = {};
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new SearchLayerSliderViewModel();
                    if (this.layer) {
                        this.viewModel.layerName(this.label);
                    }
                    ko.applyBindings(this.viewModel, this.domNode);
                },
                handleTransparencyChange: function (transValue) {
                    this.onTransparencyChanged(this.layer, transValue * .01);
                },
                onTransparencyChanged: function (layer, transparency) {
                    if (layer != null) {
                        layer.setOpacity(1 - transparency);
                    }
                }
            });
    });
