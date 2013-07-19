define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "./RasterFunctionWidget",
    "./base/StretchWidget",
    "./base/StatisticsWidget",
    "./base/NdviWidget",
    "./base/HillshadeWidget",
    "./base/FalseColorWidget",
    "./base/AspectWidget"
],
    function (declare, lang, RasterFunctionWidget, StretchWidget, StatisticsWidget, NdviWidget, HillshadeWidget, FalseColorWidget, AspectWidget) {
        return declare(
            [RasterFunctionWidget],
            {
                clearFunctionWidgetsOnLayerApplied: false,
                createHillshadeWidget: true,
                createStretchWidget: true,
                createAspectWidget: true,
                createNDVIWidget: true,
                createFalseColorWidget: true,
                createStatisticsWidget: true,
                constructor: function (params) {
                    lang.mixin(this, params || {});
                },
                createRasterFunctionWidgets: function () {
                    if (this.createStatisticsWidget) {
                        this.initStatisticsWidget();
                    }
                    if (this.createHillshadeWidget) {
                        this.initHillshadeWidget()

                    }
                    if (this.createStretchWidget) {
                        this.initStretchWidget();
                    }

                    if (this.createAspectWidget) {
                        this.initAspectWidget();
                    }
                    if (this.createNDVIWidget) {
                        this.initNDVIWidget();

                    }
                    if (this.createFalseColorWidget) {
                        this.initFalseColorWidget();

                    }
                    this.applyBindings();
                },
                initFalseColorWidget: function () {
                    var falseColorWidget = new FalseColorWidget().placeAt(this.rasterFunctionWidgetsContainer);
                    falseColorWidget.on("change",lang.hitch(this,this.handleFalseColorWidgetChange));
                    this.falseColorViewItem = {label: "False Color", widget: falseColorWidget, bandReorder: true};
                    this.addRasterFunction(this.falseColorViewItem);
                },
                handleFalseColorWidgetChange: function(){
                    var selectedRasterFunctionObject = this.viewModel.selectedRasterFunction();
                    if(selectedRasterFunctionObject && selectedRasterFunctionObject.widget == this.falseColorViewItem.widget){
                        this.applyFunction();
                    }
                },
                initNDVIWidget: function () {
                    var ndviWidget = new NdviWidget().placeAt(this.rasterFunctionWidgetsContainer);
                    this.ndviViewItem = {label: "NDVI", widget: ndviWidget};
                    this.addRasterFunction(this.ndviViewItem);
                },
                initAspectWidget: function () {
                    var aspectWidget = new AspectWidget().placeAt(this.rasterFunctionWidgetsContainer);
                    this.aspectViewItem = {label: "Aspect", widget: aspectWidget};
                    this.addRasterFunction(this.aspectViewItem);
                },
                initStretchWidget: function () {
                    var stretchWidget = new StretchWidget().placeAt(this.rasterFunctionWidgetsContainer);
                    this.stretchViewItem = {label: "Stretch", widget: stretchWidget};
                    this.addRasterFunction(this.stretchViewItem);
                },
                initHillshadeWidget: function () {
                    var hillshadeWidget = new HillshadeWidget().placeAt(this.rasterFunctionWidgetsContainer);
                    this.hillshadeViewItem = {label: "Hillshade", widget: hillshadeWidget};
                    this.addRasterFunction(this.hillshadeViewItem);
                },
                initStatisticsWidget: function () {
                    var statisticsWidget = new StatisticsWidget().placeAt(this.rasterFunctionWidgetsContainer);
                    this.statisticsViewItem = {label: "Statistics", widget: statisticsWidget};
                    this.addRasterFunction(this.statisticsViewItem);
                },
                disableNDVIWidget: function () {
                    this.viewModel.removeRasterFunctionSelectOption(this.ndviViewItem);
                },
                enableNDVIWidget: function () {
                    this.viewModel.addRasterFunctionSelectOption(this.ndviViewItem);
                },
                disableFalseColorWidget: function () {
                    this.viewModel.removeRasterFunctionSelectOption(this.falseColorViewItem);
                },
                enableFalseColorWidget: function () {
                    this.viewModel.addRasterFunctionSelectOption(this.falseColorViewItem);
                },
                disableStretchWidget: function () {
                    this.viewModel.removeRasterFunctionSelectOption(this.stretchViewItem);
                },
                enableStretchWidget: function () {
                    this.viewModel.addRasterFunctionSelectOption(this.stretchViewItem);
                },
                disableStatisticsWidget: function () {
                    this.viewModel.removeRasterFunctionSelectOption(this.statisticsViewItem);
                },
                enableStatisticsWidget: function () {
                    this.viewModel.addRasterFunctionSelectOption(this.statisticsViewItem);
                },

                disableHillshadeWidget: function () {
                    this.viewModel.removeRasterFunctionSelectOption(this.hillshadeViewItem);
                },
                enableHillshadeWidget: function () {
                    this.viewModel.addRasterFunctionSelectOption(this.hillshadeViewItem);
                },

                disableAspectWidget: function () {
                    this.viewModel.removeRasterFunctionSelectOption(this.aspectViewItem);
                },
                enableAspectWidget: function () {
                    this.viewModel.addRasterFunctionSelectOption(this.aspectViewItem);
                }
            });
    });