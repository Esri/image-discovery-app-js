define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageManipulationContentTemplate.html",
    "dojo/_base/lang",
    "dojo/dom-style",
    "esriviewer/ui/base/UITemplatedWidget",
    "./function/RasterFunctionWidget",
    "./bands/BandReorderWidget",
    "../mensuration/MensurationWidget",
    "./model/ImageManipulationViewModel"
],
    function (declare, template, lang, domStyle, UITemplatedWidget, RasterFunctionWidget, BandReorderWidget, MensurationWidget, ImageManipulationViewModel) {
        return declare(
            [UITemplatedWidget],
            {
                _blockNextBandReorder: false,
                bindingsApplied: false,
                templateString: template,
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new ImageManipulationViewModel();
                    this._createManipulationWidgets();
                    this.viewModel.raster.subscribe(lang.hitch(this.mensurationWidget, this.mensurationWidget.cancelMensuration));
                    this.viewModel.bands.subscribe(lang.hitch(this.mensurationWidget, this.mensurationWidget.cancelMensuration));
                },
                applyBindings: function () {
                    if (!this.bindingsApplied) {
                        ko.applyBindings(this.viewModel, this.domNode);
                        this.addChildWidgetsToView();
                        this.bindingsApplied = true;
                    }
                },
                /**
                 * adds configuration widgets to the analysis widget
                 */
                addChildWidgetsToView: function () {
                    if (this.bandReorderWidget) {
                        this.bandReorderWidget.placeAt(this.bandReorderWidgetContainer);
                    }
                    if (this.rasterFunctionWidget) {
                        this.rasterFunctionWidget.placeAt(this.rasterFunctionWidgetContainer);
                    }
                    if (this.mensurationWidget) {
                        this.mensurationWidget.placeAt(this.mensurationWidgetContainer);
                    }
                    /*
                     if (this.mosaicOperationWidget) {
                     this.mosaicOperationWidget.placeAt(this.mosaicOperationWidgetContainer);
                     }
                     */
                },
                /**
                 * cancels the mensuration widget
                 */
                cancelMensuration: function () {
                    if (this.mensurationWidget) {
                        this.mensurationWidget.cancelMensuration();
                    }
                },
                /**
                 * creates all of the child manipulation widgets
                 * @private
                 */
                _createManipulationWidgets: function () {
                    this._createBandReorderWidget();
                    this._createRasterFunctionWidget();
                    //   this._createMosaicOperationWidget();
                    this._createMensurationWidget();
                    if (this.bandReorderWidget && this.rasterFunctionWidget) {
                        this.bandReorderWidget.on("beforeBandReorder", lang.hitch(this, this.handleBeforeBandReorderWidgetApplied));
                        this.rasterFunctionWidget.on("beforeApplyRasterFunction", lang.hitch(this, this.handleBeforeRasterFunctionWidgetApplied));
                        this.rasterFunctionWidget.on("afterApplyRasterFunction", lang.hitch(this, this.handleAfterRasterFunctionWidgetApplied));
                    }
                },
                /*
                 _createMosaicOperationWidget: function () {
                 if (this.mosaicOperationWidget == null) {
                 this.mosaicOperationWidget = new MosaicOperationWidget();
                 }
                 },
                 */
                _createBandReorderWidget: function () {
                    if (this.bandReorderWidget == null) {
                        this.bandReorderWidget = new BandReorderWidget();
                    }
                },
                _createRasterFunctionWidget: function () {
                    if (this.rasterFunctionWidget == null) {
                        this.rasterFunctionWidget = new RasterFunctionWidget();

                    }
                },
                _createMensurationWidget: function () {
                    if (this.mensurationWidget == null) {
                        this.mensurationWidget = new MensurationWidget();
                    }
                },
                handleAfterRasterFunctionWidgetApplied: function () {
                    this._blockNextBandReorder = false;
                },
                handleBeforeRasterFunctionWidgetApplied: function () {
                    if (this.bandReorderWidget) {
                        this._blockNextBandReorder = true;
                        this.bandReorderWidget.reset();
                    }
                },
                handleBeforeBandReorderWidgetApplied: function () {
                    if (this._blockNextBandReorder) {
                        this._blockNextBandReorder = false;
                        return;
                    }
                    if (this.rasterFunctionWidget) {
                        this.rasterFunctionWidget.clearSelectedRenderer();
                    }
                },
                clearAllImageManipulations: function () {
                    this.rasterFunctionWidget.reset();
                    this.bandReorderWidget.reset();
                },
                setQueryLayerController: function (queryLayerController) {
                    this.queryLayerController = queryLayerController;
                    if (this.queryLayerController == null || this.queryLayerController.layer == null) {
                        return;
                    }
                    this.layer = this.queryLayerController.layer;
                    if (this.layer == null || this.layer.bandCount < 2) {
                        //hide the band reorder tab
                        this.hideBandReorderTab();
                        if (this.bandReorderWidget) {
                            this.bandReorderWidget.setQueryLayerController(null);
                        }
                    }
                    else {
                        this.showBandReorderTab();
                        if (this.bandReorderWidget) {
                            this.bandReorderWidget.setQueryLayerController(this.queryLayerController);
                        }
                    }
                    if (this.mensurationWidget.layerSupportsMensuration(this.queryLayerController.layer)) {
                        this.showMensurationTab();
                        if (this.mensurationWidget) {
                            this.mensurationWidget.setQueryLayerController(this.queryLayerController);
                        }
                    }
                    else {
                        this.hideMensurationTab();
                        if (this.mensurationWidget) {
                            this.mensurationWidget.setQueryLayerController(null);
                        }
                    }
                    if (this.rasterFunctionWidget) {
                        this.rasterFunctionWidget.setQueryLayerController(this.queryLayerController);
                    }
                    this.selectNextVisibleTab();
                },

                hideRendererTab: function () {
                    domStyle.set(this.rendererTab, "display", "none");
                    this.selectNextVisibleTab();
                },
                showRendererTab: function () {
                    domStyle.set(this.rendererTab, "display", "inline");
                },

                hideMensurationTab: function () {
                    domStyle.set(this.mensurationTab, "display", "none");
                    this.selectNextVisibleTab();
                },
                showMensurationTab: function () {
                    domStyle.set(this.mensurationTab, "display", "inline");
                },
                /*
                 showMiscTab: function () {
                 domStyle.set(this.mosaicOperationsTab, "display", "inline");
                 },
                 hideMiscTab: function () {
                 domStyle.set(this.mosaicOperationsTab, "display", "none");
                 },
                 */
                hideBandReorderTab: function () {
                    domStyle.set(this.bandsTab, "display", "none");
                    this.selectNextVisibleTab();
                },
                showBandReorderTab: function () {
                    domStyle.set(this.bandsTab, "display", "inline");
                },
                selectNextVisibleTab: function () {
                    //renderer visible?
                    if (domStyle.get(this.rendererTab, "display").toLowerCase() === "inline") {
                        this.viewModel.showRaster();
                    }
                    //bands visible?
                    else if (domStyle.get(this.bandsTab, "display").toLowerCase() === "inline") {
                        this.viewModel.showBands();
                    }
                    //mensuration visible?
                    else if (domStyle.get(this.mensurationTab, "display").toLowerCase() === "inline") {
                        this.viewModel.showMensuration();

                    }
                    else {
                        //   nothing is visible
                    }
                    if (!this.bindingsApplied) {
                        this.applyBindings();
                    }
                }
            });
    });