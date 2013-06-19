define([
    "dojo/_base/declare",
    "dojo/text!./template/StatisticsWidgetTemplate.html",
    "./BaseRasterFunctionWidget",
    "dijit/form/Select",
    "dijit/form/TextBox",
    "esri/layers/RasterFunction",
    "dijit/form/Button"
],
    function (declare, template, BaseRasterFunctionWidget, Select, TextBox, RasterFunction,Button) {
        return declare(
            [BaseRasterFunctionWidget],
            {
                hasParameters: true,
                label: "Statistics",
                functionName: "Statistics",
                numberBoxWidth: "3em",
                selectWidgetWidth: "14em",
                templateString: template,
                defaultKernelRows: 3,
                defaultKernelColumns: 3,
                createRasterFunction: function () {
                    var rasterFunction = new RasterFunction();
                    rasterFunction.functionName = this.functionName;
                    var arguments = {};
                    arguments.Type = this.statisticsMethodSelect.get("value");
                    arguments.KernelColumns = parseInt(this.kernelColumnsTextBox.get("value"), 10);
                    arguments.KernelRows = parseInt(this.kernelRowsTextBox.get("value"), 10);
                    rasterFunction.arguments = arguments;
                    rasterFunction.variableName = "Raster";
                    return rasterFunction;
                }
            });

    });