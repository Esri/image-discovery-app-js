define([
    "dojo/_base/declare",
    "dojo/text!./template/NdviWidgetTemplate.html",
    "./BaseRasterFunctionWidget",
    "dojo/_base/lang" ,
    "dijit/form/Select",
    "esri/layers/RasterFunction",
    "dijit/form/Button"
],
    function (declare, template, BaseRasterFunctionWidget, lang, Select, RasterFunction, Button) {
        return declare(
            [BaseRasterFunctionWidget],
            {
                hasParameters: true,
                label: "NDVI",
                redRegexp: new RegExp(/red/i),
                infraredRegexp: new RegExp(/infrared/i),
                functionName: "NDVI",
                variableName: "Raster",
                templateString: template,
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
                    this.bandChangeListeners.push(this.nirBandSelectInput.on("change", lang.hitch(this, this.handleBandSelectChange, this.nirBandSelectInput)));
                    this.bandChangeListeners.push(this.redBandSelectInput.on("change", lang.hitch(this, this.handleBandSelectChange, this.redBandSelectInput)));
                },
                createRasterFunction: function () {
                    var rasterFunction = new RasterFunction();
                    rasterFunction.functionName = this.functionName;
                    var arguments = {};
                    arguments.VisibleBandID = parseInt(this.redBandSelectInput.get("value"), 10);
                    arguments.InfraredBandID = parseInt(this.nirBandSelectInput.get("value"), 10);
                    rasterFunction.arguments = arguments;
                    rasterFunction.variableName = this.variableName;
                    return rasterFunction;
                },
                setKeyProperties: function (keyProperties) {
                    this.blockOnChange = true;
                    this.inherited(arguments);
                    this.labelToBandIdLookup = {};
                    //clear the current selects
                    this.clearOptions();
                    var i;
                    var bandValue;
                    var redBandOption;
                    var nirBandOption;
                    if (keyProperties) {
                        if (keyProperties.BandProperties) {
                            var bandPropertiesArray = keyProperties.BandProperties;
                            if (bandPropertiesArray == null) {
                                return;
                            }
                            var currentBandObject;
                            var bandLbl;
                            for (i = 0; i < bandPropertiesArray.length; i++) {
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
                                bandValue = "" + (i);
                                var lblAsString = bandLbl.toString();
                                redBandOption = {label: lblAsString, value: bandValue};
                                nirBandOption = {label: lblAsString, value: bandValue};
                                this.redBandSelectInput.addOption(redBandOption);
                                this.nirBandSelectInput.addOption(nirBandOption);
                                this.labelToBandIdLookup[bandLbl] = bandValue;
                            }
                            this.guessCorrectBandOrdering(keyProperties.BandProperties);
                        }
                        else if (keyProperties.bandCount > 0) {
                            for (i = 0; i < keyProperties.bandCount; i++) {
                                bandLbl = i + 1;
                                bandValue = "" + (i);
                                redBandOption = {label: bandLbl, value: bandValue};
                                nirBandOption = {label: bandLbl, value: bandValue};
                                this.redBandSelectInput.addOption(redBandOption);
                                this.nirBandSelectInput.addOption(nirBandOption);
                                this.labelToBandIdLookup[bandLbl] = bandValue;
                            }
                        }
                        this.blockOnChange = false;

                    }

                },
                guessCorrectBandOrdering: function (bandPropertiesArray) {
                    if (bandPropertiesArray == null) {
                        return;
                    }
                    var infraRedBandLabel;
                    var redBandLabel;
                    var infraredLabelFound = false;
                    var redLabelFound = false;
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
                        if (redLabelFound && infraredLabelFound) {
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
                    this.handleBandChanged();
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
                }
            });

    });