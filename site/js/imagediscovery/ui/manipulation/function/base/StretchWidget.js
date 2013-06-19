define([
    "dojo/_base/declare",
    "dojo/text!./template/StretchWidgetTemplate.html",
    "./BaseRasterFunctionWidget",
    "dijit/form/Select",
    "dijit/form/NumberTextBox",
    "dijit/form/HorizontalSlider",
    "esri/layers/RasterFunction" ,
    "dijit/form/Button"

],
    function (declare, template, BaseRasterFunctionWidget, Select, NumberTextBox, HorizontalSlider, RasterFunction, Button) {
        return declare(
            [BaseRasterFunctionWidget],
            {
                hasParameters: true,
                label: "Stretch",
                functionName: "Stretch",
                selectWidgetWidth: "14em",
                templateString: template,
                defaultStandardDeviation: 0,
                defaultGamma: .1,
                defaultMinGamma: 0.1,
                defaultMaxGamma: 10,
                defaultMinStandardDev: 0,
                defaultMaxStandardDev: 5,
                handleStandardDevChange: function (value) {
                    this.standardDeviationsTextBox.set("value", value.toFixed(3));
                },
                handleGammaChange: function (value) {
                    this.gammaTextBox.set("value", value.toFixed(3));
                },

                createRasterFunction: function (layer) {
                    var rasterFunction = new RasterFunction();
                    rasterFunction.functionName = this.functionName;
                    var arguments = {};
                    arguments.StretchType = parseInt(this.stretchMethodSelect.get("value"), 10);
                    arguments.NumberOfStandardDeviations = this.standardDeviationsTextBox.get("value");
                    arguments.Gamma = [];
                    arguments.Statistics = [];
                    try {
                        var gammaValue = parseFloat(this.gammaTextBox.get("value"));
                    }
                    catch (err) {
                        return null;
                    }
                    for (var i = 0; i < layer.bandCount; i++) {
                        var bandStatistics = [layer.minValues[i], layer.maxValues[i], layer.meanValues[i], layer.stdvValues[i]];
                        arguments.Statistics.push(bandStatistics);
                        arguments.Gamma.push(gammaValue);
                    }
                    //min,max,mean,standard
                    rasterFunction.arguments = arguments;
                    rasterFunction.variableName = "Raster";
                    return rasterFunction;
                },
                handleSetStandardDevSliderValue: function () {
                    try {
                        var value = this.standardDeviationsTextBox.get("value");
                        var floatVal = parseFloat(value);
                        if (floatVal >= this.defaultMinStandardDev && floatVal <= this.defaultMaxStandardDev) {
                            this.standardDevSlider.set("value", floatVal);
                        }
                        else {
                            if (floatVal < this.defaultMinStandardDev) {
                                this.standardDevSlider.set("value", this.defaultMinStandardDev);
                            }
                            else {
                                this.standardDevSlider.set("value", this.defaultMaxStandardDev);
                            }
                        }

                    }
                    catch (err) {

                    }
                },
                handleSetGammaSliderValue: function () {
                    try {
                        var value = this.gammaTextBox.get("value");
                        var floatVal = parseFloat(value);
                        if (floatVal >= this.defaultMinGamma && floatVal <= this.defaultMaxGamma) {
                            this.gammaSlider.set("value", floatVal);
                        }
                        else {
                            if (floatVal < this.defaultMinGamma) {
                                this.gammaSlider.set("value", this.defaultMinGamma);
                            }
                            else {
                                this.gammaSlider.set("value", this.defaultMaxGamma);
                            }
                        }
                    }
                    catch (err) {

                    }
                }
            });

    });