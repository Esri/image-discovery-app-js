define([
    "dojo/_base/declare",
    "dojo/text!./template/HillshadeWidgetTemplate.html",
    "./BaseRasterFunctionWidget",
    "dijit/form/TextBox",
    "esri/layers/RasterFunction",
    "dijit/form/Button"
],
    function (declare, template, BaseRasterFunctionWidget,TextBox,RasterFunction,Button) {
        return declare(
            [BaseRasterFunctionWidget],
            {
                hasParameters: true,
                label: "Hillshade",
                functionName: "Hillshade",
                numberBoxWidth: "3em",
                templateString:template,
                defaultAzimuth:3,
                defaultAltitude:4,
                defaultZFactor:4,
                createRasterFunction:function () {
                    var rasterFunction = new RasterFunction();
                    rasterFunction.functionName = this.functionName;
                    var arguments = {};
                    arguments.Azimuth = parseFloat(this.azimuthTextInput.get("value"));
                    arguments.Altitude = parseFloat(this.altitudeTextInput.get("value"));
                    arguments.ZFactor = parseFloat(this.zfactorTextInput.get("value"));
                    rasterFunction.arguments = arguments;
                    rasterFunction.variableName = "DEM";
                    return rasterFunction;
                }
            });

    }
)
;