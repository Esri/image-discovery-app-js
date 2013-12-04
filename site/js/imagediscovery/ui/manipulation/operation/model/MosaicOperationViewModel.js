define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    'esri/layers/MosaicRule',
    "dojo/topic"
],
    function (declare,  lang, MosaicRule,topic) {
        return declare(
            [],
            {
                LOOKUP_OBSERVABLE_ENTRY: "lookupObservableEntry",

                constructor: function () {
                    this.mosaicOperationSelectLabel = ko.observable("Mosaic Operation:");
                    this.mosaicOperations = ko.observableArray([
                        {label: "First", value: MosaicRule.OPERATION_FIRST},
                        {label: "Blend", value: MosaicRule.OPERATION_BLEND},
                        {label: "Last", value: MosaicRule.OPERATION_LAST},
                        {label: "Max", value: MosaicRule.OPERATION_MAX},
                        {label: "Mean", value: MosaicRule.OPERATION_MEAN},
                        {label: "Min", value: MosaicRule.OPERATION_MIN}
                    ]);
                    this.selectedMosaicOperation = ko.observable(null);
                    this.selectedMosaicOperation.subscribe(lang.hitch(this, this.handleMosaicOperationChanged));
                },
                handleMosaicOperationChanged: function (value) {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.SET_MOSAIC_OPERATION,value);
                }

            });

    })
;