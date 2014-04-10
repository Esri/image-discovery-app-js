define([
    "dojo/_base/declare",
    "dojo/text!./template/RasterFunctionTemplate.html",
  //  "xstyle/css!./theme/RasterFunctionTheme.css",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/_base/array",
    "../base/ImageManipulationWidgetBase",
    "./base/BaseBandReorderWidget",
    "./base/BaseRasterFunctionWidget",
    "./model/RasterFunctionViewModel"

],
   // function (declare, template, theme, topic, lang, array, ImageManipulationWidgetBase, BaseBandReorderWidget, BaseRasterFunctionWidget, RasterFunctionViewModel) {
    function (declare, template,  topic, lang, array, ImageManipulationWidgetBase, BaseBandReorderWidget, BaseRasterFunctionWidget, RasterFunctionViewModel) {
        return declare(
            [ImageManipulationWidgetBase],
            {
                _rasterFunctionBaseMID: "imagediscovery/ui/manipulation/function/base/",
                DEFAULT_RASTER_FUNCTION_LABELS: {
                    STRETCH: "stretch",
                    HILLSHADE: "hillshade",
                    ASPECT: "aspect",
                    STATISTICS: "statistics",
                    NDVI: "ndvi",
                    FALSE_COLOR: "falsecolor"

                },
                bindingsApplied: false,
                ignoreRasterFunctionInfos: ["none"],
                clearFunctionWidgetsOnLayerApplied: true,
                clearFunctionWidgetsOnKeyPropertiesApplied: false,
                hasBandReorderFunctionApplied: false,
                hasRasterFunctionApplied: false,
                templateString: template,
                constructor: function () {
                    this.defaultRasterFunctions = null;
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new RasterFunctionViewModel();
                    this.viewModel.selectedRasterFunction.subscribe(lang.hitch(this, this.handleCheckForNoParameterRasterFunction));
                    this.createRasterFunctionWidgets();

                },
                loadViewerConfigurationData: function () {
                    var rasterFunctionsConfiguration;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "rasterFunctions", function (rasterFunctionsConf) {
                        rasterFunctionsConfiguration = rasterFunctionsConf;
                    });
                    if (rasterFunctionsConfiguration != null && lang.isObject(rasterFunctionsConfiguration)) {
                        this.defaultRasterFunctions = rasterFunctionsConfiguration;
                    }


                },
                applyBindings: function () {
                    if (!this.bindingsApplied) {
                        ko.applyBindings(this.viewModel, this.domNode);
                        this.bindingsApplied = true;
                    }
                },
                createRasterFunctionWidgets: function () {

                },
                initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.reset));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP, lang.hitch(this, this.reset));
                },
                applyFunction: function () {
                    var selectedRasterFunctionObject = this.viewModel.selectedRasterFunction();
                    if (selectedRasterFunctionObject == null) {
                        this.reset();
                    }
                    else {
                        var topicToPublish = null;
                        var publishArguments = null;
                        var selectedWidget = selectedRasterFunctionObject.widget;
                        //see if it's an actual raster function
                        if (selectedWidget instanceof BaseRasterFunctionWidget) {
                            if (this.hasBandReorderFunctionApplied) {
                                this.clearBandReorder();
                            }
                            this.queryLayerController.applyRasterFunction(selectedWidget);
                            this.hasRasterFunctionApplied = true;
                        }
                        //see if it's a band reorder widget acting like a raster function
                        else if (selectedWidget instanceof BaseBandReorderWidget) {
                            if (this.hasRasterFunctionApplied) {
                                this.clearRasterFunction();
                            }
                            this.queryLayerController.reorderBands(selectedWidget.getBandOrder());
                            this.hasBandReorderFunctionApplied = true;
                        }
                        if (topicToPublish != null) {
                            this.onBeforeApplyRasterFunction();
                            topic.publish(topicToPublish, publishArguments);
                            this.onAfterApplyRasterFunction();
                        }
                    }
                },
                onBeforeApplyRasterFunction: function () {

                },
                onAfterApplyRasterFunction: function () {

                },
                clearRasterFunction: function () {
                    if (this.hasRasterFunctionApplied) {
                        this.queryLayerController.clearRasterFunction();
                        this.hasRasterFunctionApplied = false;
                    }
                },
                clearSelectedRenderer: function () {
                    this.viewModel.selectedRasterFunction(null);

                },
                clearBandReorder: function () {
                    if (this.hasBandReorderFunctionApplied) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.REORDER_BANDS, [],false);
                        this.hasBandReorderFunctionApplied = false;
                    }
                },
                setKeyProperties: function (keyProperties) {
                    this.inherited(arguments);

                    if (this.clearFunctionWidgetsOnKeyPropertiesApplied) {
                        this.viewModel.rasterFunctions.removeAll();
                    }
                    this.reset();
                    var rasterFunctionsArray = this.viewModel.rasterFunctions();
                    var currentRasterFunctionWidget;
                    for (var i = 0; i < rasterFunctionsArray.length; i++) {
                        currentRasterFunctionWidget = rasterFunctionsArray[i].widget;
                        if (currentRasterFunctionWidget) {
                            currentRasterFunctionWidget.setKeyProperties(keyProperties);
                        }
                    }
                },
                setQueryLayerController: function (queryLayerController) {
                    if (queryLayerController == null || queryLayerController.layer == null) {
                        return;
                    }
                    var layer = queryLayerController.layer;
                    this.inherited(arguments);
                    if (this.clearFunctionWidgetsOnLayerApplied) {
                        this.viewModel.rasterFunctions.removeAll();
                    }
                    this.reset();
                    this.createFunctionWidgetsFromLayer(layer);
                    this.createDefaultRasterFunctions(layer);
                    var rasterFunctionsArray = this.viewModel.rasterFunctions();
                    var currentRasterFunctionWidget;
                    for (var i = 0; i < rasterFunctionsArray.length; i++) {
                        currentRasterFunctionWidget = rasterFunctionsArray[i].widget;
                        if (currentRasterFunctionWidget) {
                            currentRasterFunctionWidget.setQueryLayerController(queryLayerController);
                        }
                    }
                    //attempt to apply bindings
                    this.applyBindings();

                },
                createDefaultRasterFunctions: function (layer) {
                    if (this.defaultRasterFunctions &&
                        this.defaultRasterFunctions.allowDefaults === true &&
                        this.defaultRasterFunctions.defaults && lang.isObject(this.defaultRasterFunctions.defaults)) {
                        var defaultRasterFunctionLoadHandler = lang.hitch(this, this._handleDefaultRasterFunctionResolved, layer);

                        var currentValue;
                        for (var key in this.defaultRasterFunctions.defaults) {
                            currentValue = this.defaultRasterFunctions.defaults[key];
                            if (currentValue.show) {
                                if (key === this.DEFAULT_RASTER_FUNCTION_LABELS.ASPECT) {
                                    require([this._rasterFunctionBaseMID + "AspectWidget"], defaultRasterFunctionLoadHandler);
                                }
                                /*
                                 else if (key === this.DEFAULT_RASTER_FUNCTION_LABELS.FALSE_COLOR) {
                                 require([this._rasterFunctionBaseMID + "FalseColorWidget"], defaultRasterFunctionLoadHandler);
                                 }
                                 */
                                else if (key === this.DEFAULT_RASTER_FUNCTION_LABELS.HILLSHADE) {
                                    require([this._rasterFunctionBaseMID + "HillshadeWidget"], defaultRasterFunctionLoadHandler);
                                }
                                else if (key === this.DEFAULT_RASTER_FUNCTION_LABELS.NDVI) {
                                    require([this._rasterFunctionBaseMID + "NdviWidget"], defaultRasterFunctionLoadHandler);
                                }
                                else if (key === this.DEFAULT_RASTER_FUNCTION_LABELS.STATISTICS) {
                                    require([this._rasterFunctionBaseMID + "StatisticsWidget"], defaultRasterFunctionLoadHandler);
                                }
                                else if (key === this.DEFAULT_RASTER_FUNCTION_LABELS.STRETCH) {
                                    require([this._rasterFunctionBaseMID + "StretchWidget"], defaultRasterFunctionLoadHandler);
                                }
                            }
                        }
                    }
                },
                _handleDefaultRasterFunctionResolved: function (layer, rasterFunctionClass) {
                    var rasterFunctionInstance = new rasterFunctionClass();
                    rasterFunctionInstance.setKeyProperties(layer);
                    rasterFunctionInstance.placeAt(this.rasterFunctionWidgetsContainer);
                    this.addRasterFunction({label: rasterFunctionInstance.label, widget: rasterFunctionInstance});
                },
                createFunctionWidgetsFromLayer: function (layer) {
                    if (layer && layer.rasterFunctionInfos) {
                        var currentRasterFunctionInfo;
                        var currentRasterFunctionNameLower;
                        for (var i = 0; i < layer.rasterFunctionInfos.length; i++) {
                            currentRasterFunctionInfo = layer.rasterFunctionInfos[i];
                            if (currentRasterFunctionInfo == null || currentRasterFunctionInfo.name == null || currentRasterFunctionInfo.name == "") {
                                continue;
                            }
                            currentRasterFunctionNameLower = currentRasterFunctionInfo.name.toLowerCase();
                            if (array.indexOf(this.ignoreRasterFunctionInfos, currentRasterFunctionNameLower) > -1) {
                                //set as ignored in the ignore array
                                continue;
                            }

                            var functionWidget = new BaseRasterFunctionWidget({functionName: currentRasterFunctionInfo.name}).placeAt(this.rasterFunctionWidgetsContainer);
                            this.addRasterFunction({label: currentRasterFunctionInfo.name, widget: functionWidget});
                        }
                    }
                },
                addRasterFunction: function (functionItem) {
                    if (functionItem == null || !lang.isObject(functionItem) || functionItem.label == null || functionItem.widget == null) {
                        return;
                    }
                    this.viewModel.addRasterFunction(functionItem);
                    //listen for on change
                    if (functionItem.bandReorder == null || functionItem.bandReorder == false) {
                        functionItem.widget.on("applyFunction", lang.hitch(this, this.handleRasterFunctionChange, functionItem.widget));
                    }
                },
                handleCheckForNoParameterRasterFunction: function () {
                    var selectedRasterFunctionObject = this.viewModel.selectedRasterFunction();
                    if (selectedRasterFunctionObject == null) {
                        this.applyFunction();
                    }
                    else {
                        var rasterFunctionWidget = selectedRasterFunctionObject.widget;
                        if (!rasterFunctionWidget.hasParameters) {
                            this.applyFunction();
                        }
                    }
                },
                handleRasterFunctionChange: function (widget) {
                    var selectedRasterFunctionItem = this.viewModel.selectedRasterFunction();
                    if (selectedRasterFunctionItem == null || selectedRasterFunctionItem.widget == null) {
                        return;
                    }
                    if (selectedRasterFunctionItem.widget == widget) {
                        this.applyFunction();
                    }
                },
                reset: function () {
                    this.clearBandReorder();
                    this.clearRasterFunction();
                    this.clearSelectedRenderer();
                }
            });
    });