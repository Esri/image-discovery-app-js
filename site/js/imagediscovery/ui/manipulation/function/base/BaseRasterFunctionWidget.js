define([
    "dojo/_base/declare",
    "dojo/text!./template/NoContentTemplate.html",
    "dojo/dom-style",
    "dojo/_base/lang",
    "../../base/ImageManipulationWidgetBase",
    "esri/layers/RasterFunction"
],
    function (declare, template, domStyle, lang, ImageManipulationWidgetBase, RasterFunction) {
        return declare(
            [ImageManipulationWidgetBase],
            {
                hasParameters: false,
                blockOnChange: false,
                functionName: "",
                templateString: template,
                constructor: function (params) {
                    lang.mixin(this, params || {});
                },
                show: function () {
                    domStyle.set(this.domNode, "display", "block");
                },
                hide: function () {
                    domStyle.set(this.domNode, "display", "none");
                },
                createRasterFunction: function () {
                    if (this.functionName == null || this.functionName == "") {
                        return null;
                    }
                    var rasterFunction = new RasterFunction();
                    rasterFunction.functionName = this.functionName;
                    return rasterFunction;
                },
                applyFunction: function () {
                    this.onApplyFunction();
                },
                onChange: function () {

                },
                onApplyFunction: function () {

                }

            });

    });