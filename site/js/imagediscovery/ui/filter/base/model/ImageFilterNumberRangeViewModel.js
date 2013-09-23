define([
    "dojo/_base/declare",
    "dojo/Evented"
],
    function (declare, Evented) {
        return declare(
            [Evented],
            {
                APPLY_FILTER: "applyFilter",
                CLEAR_FILTER: "clearFilter",
                constructor: function () {
                    this.unitsLabel = ko.observable("%");
                    this.lessThanSelected = ko.observable(true);
                    this.greaterThanSelected = ko.observable(false);
                    this.rangeSelected = ko.observable(false);
                    this.currentMinValue = ko.observable(0.0);
                    this.currentMaxValue = ko.observable(0.0);
                    this.currentLessThanValue = ko.observable();
                    this.currentGreaterThanValue = ko.observable();
                    this.currentMinRangeValue = ko.observable();
                    this.currentMaxRangeValue = ko.observable();
                },
                enableLessThan: function () {
                    this.resetValues();
                    this.lessThanSelected(true);
                    this.greaterThanSelected(false);
                    this.rangeSelected(false);
                },
                enableGreaterThan: function () {
                    this.resetValues();
                    this.lessThanSelected(false);
                    this.greaterThanSelected(true);
                    this.rangeSelected(false);
                },
                enableRange: function () {
                    this.resetValues();
                    this.lessThanSelected(false);
                    this.greaterThanSelected(false);
                    this.rangeSelected(true);
                },
                resetValues: function () {
                    this.currentLessThanValue("");
                    this.currentGreaterThanValue("");
                    this.currentMinRangeValue("");
                    this.currentMaxRangeValue("");
                    this.emit(this.CLEAR_FILTER);
                },
                validateLessThan: function (obj,e) {
                    if (VIEWER_UTILS.isEnterKey(e)) {
                        this.applyLessThanFilter();
                    }
                    else {
                        this._validateEntry(this.currentLessThanValue);
                    }

                },
                validateGreaterThan: function (obj, e) {
                    if (VIEWER_UTILS.isEnterKey(e)) {
                        this.applyGreaterThanFilter();
                    }
                    else {


                        this._validateEntry(this.currentGreaterThanValue);
                    }

                },
                validateMinRange: function (obj, e) {
                    if (VIEWER_UTILS.isEnterKey(e)) {
                        this.applyRangeFilter();
                    }
                    else {
                        this._validateEntry(this.currentMinRangeValue);
                    }
                },
                validateMaxRange: function (obj, e) {
                    if (VIEWER_UTILS.isEnterKey(e)) {
                      this.applyRangeFilter();
                    }
                    else {
                        this._validateEntry(this.currentMaxRangeValue);
                    }
                },
                _validateEntry: function (koValFxn) {
                    var currentVal = koValFxn();
                    var sanitized = REG_EXP_UTILS.stripNonNumeric(currentVal);
                    var sanitizedAsFloat = parseFloat(sanitized);
                    if (sanitized != currentVal) {
                        if (isNaN(sanitizedAsFloat)) {
                            koValFxn("");
                        }
                        else {
                            koValFxn(sanitizedAsFloat);
                        }
                    }
                },
                applyLessThanFilter: function () {
                    var asFloat = parseFloat(this.currentLessThanValue());
                    if (!isNaN(asFloat)) {
                        this.emit(this.APPLY_FILTER, {max: asFloat});
                    }
                    else {
                        this.emit(this.CLEAR_FILTER);
                    }
                },
                applyGreaterThanFilter: function () {
                    var asFloat = parseFloat(this.currentGreaterThanValue());
                    if (!isNaN(asFloat)) {
                        this.emit(this.APPLY_FILTER, {min: asFloat});
                    }
                    else {
                        this.emit(this.CLEAR_FILTER);
                    }
                },
                applyRangeFilter: function () {
                    var minFloat = parseFloat(this.currentMinRangeValue());
                    var maxFloat = parseFloat(this.currentMaxRangeValue());
                    if (!isNaN(minFloat) && !isNaN(maxFloat)) {
                        this.emit(this.APPLY_FILTER, {min: minFloat, max: maxFloat});
                    }
                    else {
                        this.emit(this.CLEAR_FILTER);
                    }
                }
            });
    });