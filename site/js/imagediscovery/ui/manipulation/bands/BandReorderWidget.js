define([
    "dojo/_base/declare",
    "dojo/text!./template/BandReorderTemplate.html",
    //  "xstyle/css!./theme/BandReorderTheme.css",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "../base/ImageManipulationWidgetBase",
    "dijit/form/Select",
    "dijit/form/Button"
],
//    function (declare, template, theme,  array, lang, domConstruct, ImageManipulationWidgetBase, Select, Button) {
    function (declare, template, array, lang, domConstruct, ImageManipulationWidgetBase, Select, Button) {
        return declare(
            [ImageManipulationWidgetBase],
            {
                maxDisplayBandCount: 3,
                bandSelectWidth: "50%",
                templateString: template,
                constructor: function () {
                    this.bandChangeListeners = [];
                    this.bandSelects = [];
                    this.currentBandOrdering = [];
                },
                setQueryLayerController: function (queryLayerController) {
                    this.inherited(arguments);
                    if (this.layer == null) {
                        return;
                    }
                    if (this.layer == null || this.layer.bands == null) {
                        domConstruct.empty(this.bandReorderSelectContainer);
                        return;
                    }
                    this.setBandProperties(this.layer.bands);
                },
                clearBandSelectOptions: function () {
                    domConstruct.empty(this.bandReorderSelectContainer);
                },
                setBandProperties: function (bandPropertiesArray) {
                    this.bandSelects = [];
                    this.currentBandOrdering = [];
                    domConstruct.empty(this.bandReorderSelectContainer);

                    if (bandPropertiesArray == null || bandPropertiesArray.length < 2) {
                        return;
                    }
                    var bandLoopCount = bandPropertiesArray.length > this.maxDisplayBandCount ? this.maxDisplayBandCount : bandPropertiesArray.length;
                    for (var i = 0; i < bandLoopCount; i++) {
                        var bandEntry = domConstruct.create("div", {className: "bandReorderEntry"});
                        var bandEntryLbl = domConstruct.create("span", {innerHTML: (i + 1), className: "bandReorderBandIndexLbl"});
                        domConstruct.place(bandEntryLbl, bandEntry);
                        domConstruct.place(bandEntry, this.bandReorderSelectContainer);
                        var bandSelect = new Select({style: {width: this.bandSelectWidth}});
                        domConstruct.place(bandSelect.domNode, bandEntry);
                        this.bandSelects.push(bandSelect);
                        var bandLbl;
                        for (var j = 0; j < bandPropertiesArray.length; j++) {
                            bandLbl = "";
                            if (bandPropertiesArray.length > j) {
                                if (bandPropertiesArray[j].BandName) {
                                    bandLbl = bandPropertiesArray[j].BandName;
                                }
                                else {
                                    bandLbl = j + 1;
                                }
                            }
                            else {
                                bandLbl = j + 1;
                            }
                            var bandValue = "" + j;
                            var bandOption = {label: bandLbl + "", value: bandValue};
                            bandSelect.addOption(bandOption);
                            if (j === i) {
                                bandSelect.set("value", bandValue);
                            }
                        }
                        this.bandChangeListeners.push(bandSelect.on("change", lang.hitch(this, this.handleBandSelectChange, bandSelect)));
                    }
                },
                applyBandReorder: function () {
                    //two events are fired for each change. one for checked and unchecked. we only want to listen on one
                    var i;
                    var selectedBandIndexes = [];
                    var currentBandSelect;
                    var bandSelectValue;
                    var currentRadio;
                    for (i = 0; i < this.bandSelects.length; i++) {
                        currentBandSelect = this.bandSelects[i];
                        bandSelectValue = parseInt(currentBandSelect.get("value"), 10);
                        selectedBandIndexes.push(bandSelectValue);
                    }
                    //see if there are dupe bands in the selected array
                    var selectedBands = [];
                    var currBandId;
                    for (i = 0; i < selectedBandIndexes.length; i++) {
                        currBandId = selectedBandIndexes[i];
                        if (array.indexOf(selectedBands, currBandId) > -1) {
                            //there are dupes in the band ordering
                            return;
                        }
                        else {
                            selectedBands.push(currBandId);
                        }
                    }
                    //see if there is a change to the band ordering
                    var hasChange = false;
                    if (this.currentBandOrdering.length == selectedBandIndexes.length) {
                        for (i = 0; i < this.currentBandOrdering.length; i++) {
                            if (this.currentBandOrdering[i] != selectedBandIndexes[i]) {
                                hasChange = true;
                                break;
                            }
                        }
                    }
                    else {
                        hasChange = true;
                    }
                    if (hasChange) {
                        this.currentBandOrdering = selectedBandIndexes;
                        this.onBeforeBandReorder();
                        this.queryLayerController.reorderBands(this.currentBandOrdering);
                        this.onBandsReordered();
                    }
                },
                handleBandSelectChange: function (bandSelect, value) {
                    //find the dupe
                    var selectedBands = {};
                    var currentBandSelect;
                    var currBandValue;
                    var currentBandOptionValue;
                    var i;
                    for (i = 0; i < this.bandSelects.length; i++) {
                        selectedBands[this.bandSelects[i].get("value")] = "selected";
                    }
                    for (i = 0; i < this.bandSelects.length; i++) {
                        currentBandSelect = this.bandSelects[i];
                        if (currentBandSelect != bandSelect) {
                            currBandValue = currentBandSelect.get("value");
                            if (currBandValue === value) {
                                //find the unused band
                                for (var j = 0; j < currentBandSelect.options.length; j++) {
                                    currentBandOptionValue = currentBandSelect.options[j].value;
                                    if (!selectedBands[currentBandOptionValue]) {
                                        currentBandSelect.set("value", currentBandOptionValue);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                },
                reset: function () {
                    //see if the bands are already in order
                    var bandsInOrder = true;
                    var i;
                    for (i = 0; i < this.bandSelects.length; i++) {
                        if (i != this.bandSelects[i].get("value")) {
                            bandsInOrder = false;
                        }
                    }
                    if (!bandsInOrder) {
                        if (this.bandSelects && lang.isArray(this.bandSelects) && this.bandSelects.length > 0) {
                            for (i = 0; i < this.bandSelects.length; i++) {
                                this.bandSelects[i].set("value", ("" + i));
                            }
                            this.applyBandReorder();
                        }
                    }
                },
                onBeforeBandReorder: function () {

                },
                onBandsReordered: function () {

                }
            });
    });