define([
    "dojo/_base/declare",
    "dojo/text!./template/MosaicOperationTemplate.html",
    "dojo/topic",
    "dojo/_base/lang",
    "../base/ImageManipulationWidgetBase",
    "./model/MosaicOperationViewModel"

],
    function (declare, template, topic, lang,  ImageManipulationWidgetBase, MosaicOperationViewModel) {
        return declare(
            [ImageManipulationWidgetBase],
            {
                templateString: template,
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new MosaicOperationViewModel();
                    ko.applyBindings(this.viewModel, this.domNode);
                    this.viewModel.selectedMosaicOperation.subscribe(lang.hitch(this, this.applyFunction));

                },
                initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.reset));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP, lang.hitch(this, this.reset));
                },
                applyFunction: function () {
                    var selectedMosaicOperation = this.viewModel.selectedMosaicOperation();
                    if (selectedMosaicOperation == null) {
                        this.reset();
                    }
                    else {
                        //apply the mosaic operation
                    }
                },
                reset: function () {

                }
            });
    });