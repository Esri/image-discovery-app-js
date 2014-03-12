define([
    "dojo/_base/declare",
    "dojo/text!./template/FalseColorWidgetTemplate.html",
    "dojo/_base/lang",
    "./BaseBandReorderWidget",
    "dijit/form/Select",
    "dijit/form/Button"
],
    function (declare, template, lang, BaseBandReorderWidget, Select, Button) {
        return declare(
            [BaseBandReorderWidget],
            {
                hasParameters: true,
                label: "False Color",
                templateString: template,
                redRegexp: new RegExp(/red/i),
                greenRegexp: new RegExp(/green/i),
                infraredRegexp: new RegExp(/infrared/i),
                selectWidgetWidth: "12em",
                labelToBandIdLookup: {},

                constructor: function () {
                    this.bandChangeListeners = [];
                    this.bandSelects = [];
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.bandSelects.push(this.nirBandSelectInput);
                    this.bandSelects.push(this.redBandSelectInput);
                    this.bandSelects.push(this.greenBandSelectInput);
                    this.bandChangeListeners.push(this.nirBandSelectInput.on("change", lang.hitch(this, this.handleBandSelectChange, this.nirBandSelectInput)));
                    this.bandChangeListeners.push(this.redBandSelectInput.on("change", lang.hitch(this, this.handleBandSelectChange, this.redBandSelectInput)));
                    this.bandChangeListeners.push(this.greenBandSelectInput.on("change", lang.hitch(this, this.handleBandSelectChange, this.greenBandSelectInput)));
                },
                setKeyProperties: function (keyProperties) {
                    this.blockOnChange = true;
                    this.inherited(arguments);
                    this.labelToBandIdLookup = {};
                    //clear the current selects
                    this.clearOptions();
                    if (keyProperties && keyProperties.BandProperties) {
                        var bandPropertiesArray = keyProperties.BandProperties;
                        if (bandPropertiesArray == null) {
                            return;
                        }
                        var currentBandObject;
                        var bandLbl;
                        for (var i = 0; i < bandPropertiesArray.length; i++) {
                            bandLbl = "";
                            if (bandPropertiesArray.length > i) {
                                if (bandPropertiesArray[i].BandName) {
                                    bandLbl = bandPropertiesArray[i].BandName;
                                }
                                else {
                                    bandLbl = i + 1;
                                }
                            }
                            else {
                                bandLbl = i + 1;
                            }
                            var bandValue = "" + (i);
                            var lblAsString = bandLbl.toString();
                            var redBandOption = {label: lblAsString, value: bandValue};
                            var nirBandOption = {label: lblAsString, value: bandValue};
                            var greenBandOption = {label: lblAsString, value: bandValue};
                            this.redBandSelectInput.addOption(redBandOption);
                            this.nirBandSelectInput.addOption(nirBandOption);
                            this.greenBandSelectInput.addOption(greenBandOption);
                            this.labelToBandIdLookup[bandLbl] = bandValue;
                        }
                        this.guessCorrectBandOrdering(keyProperties.BandProperties);
                        this.blockOnChange = false;
                    }
                },
                guessCorrectBandOrdering: function (bandPropertiesArray) {
                    if (bandPropertiesArray == null) {
                        return;
                    }
                    var infraRedBandLabel;
                    var redBandLabel;
                    var greenBandLabel;
                    var infraredLabelFound = false;
                    var redLabelFound = false;
                    var greenLabelFound = false;
                    var currentBandObject;
                    var bandLbl;
                    for (var i = 0; i < bandPropertiesArray.length; i++) {
                        bandLbl = "";
                        if (bandPropertiesArray[i].BandName) {
                            bandLbl = bandPropertiesArray[i].BandName;
                        }
                        if (bandLbl == null || bandLbl == "") {
                            continue;
                        }
                        //check green
                        if (!greenLabelFound && this.greenRegexp.test(bandLbl)) {
                            greenBandLabel = bandLbl;
                            greenLabelFound = true;
                        }
                        //check infrared
                        if (!infraredLabelFound && this.infraredRegexp.test(bandLbl)) {
                            infraRedBandLabel = bandLbl;
                            infraredLabelFound = true;
                        }
                        //check red
                        if (!redLabelFound) {
                            //make sure its not infrared label since red is also in infrared
                            if (!this.infraredRegexp.test(bandLbl) && this.redRegexp.test(bandLbl)) {
                                redBandLabel = bandLbl;
                                redLabelFound = true;
                            }
                        }
                        if (redLabelFound && infraredLabelFound && greenLabelFound) {
                            //we found both so stop looping
                            break;
                        }
                    }
                    if (redLabelFound) {
                        //find the index of the red label
                        var redBandId = this.labelToBandIdLookup[redBandLabel];
                        if (redBandId != null) {
                            this.redBandSelectInput.set("value", redBandId);
                        }

                    }
                    if (infraredLabelFound) {
                        //find the index of the red label
                        var infraredBandId = this.labelToBandIdLookup[infraRedBandLabel];
                        if (infraredBandId != null) {
                            this.nirBandSelectInput.set("value", infraredBandId);
                        }

                    }
                    if (greenLabelFound) {
                        var greenBandId = this.labelToBandIdLookup[greenBandLabel];
                        if (greenBandId != null) {
                            this.greenBandSelectInput.set("value", greenBandId);
                        }
                    }

                },
                handleBandSelectChange: function (bandSelect, value) {
                    if (this.blockOnChange) {
                        return;
                    }
                    this.blockOnChange = true;
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
                                        this.blockOnChange = false;
                                        return;
                                    }
                                }
                            }
                        }
                    }
                    this.blockOnChange = false;
                 //   this.handleBandChanged();
                },
                handleBandChanged: function () {
                    if (!this.blockOnChange) {
                        this.onChange();
                    }
                },
                clearOptions: function () {
                    for (var i = 0; i < this.bandSelects.length; i++) {
                        this.bandSelects[i].removeOption(this.bandSelects[i].getOptions());
                    }
                },
                getBandOrder: function () {
                    var nir = parseInt(this.nirBandSelectInput.get("value"), 10);
                    var red = parseInt(this.redBandSelectInput.get("value"), 10);
                    var green = parseInt(this.greenBandSelectInput.get("value"), 10);
                    return [nir, red, green];
                }
            });
    });