define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageFilterNumberRangeWidgetTemplate.html",
 //   "xstyle/css!./theme/ImageFilterNumberRangeTheme.css",
    "dojo/_base/lang",
    "./BaseImageryFilterWidget",
    "./model/ImageFilterNumberRangeViewModel"
],
  //  function (declare, template, css, lang,  BaseImageryFilterWidget, ImageFilterNumberRangeViewModel) {
    function (declare, template,  lang,  BaseImageryFilterWidget, ImageFilterNumberRangeViewModel) {
        return declare(
            [BaseImageryFilterWidget],
            {
                bindingsApplied: false,
                templateString: template,
                unitsLabel: "%",
                postCreate: function () {
                    this.viewModel = new ImageFilterNumberRangeViewModel();
                    this.viewModel.unitsLabel(this.unitsLabel);
                    this.viewModel.on(this.viewModel.APPLY_FILTER, lang.hitch(this, this.handleViewModelApplyFilter));
                    this.viewModel.on(this.viewModel.CLEAR_FILTER, lang.hitch(this, this.clearFilterFunction));
                    this.inherited(arguments);
                },
                applyBindings: function () {
                    if (!this.bindingsApplied) {
                        ko.applyBindings(this.viewModel, this.domNode);
                        this.bindingsApplied = true;
                    }
                },
                handleViewModelApplyFilter: function (obj) {
                    this.applyFilterFunctionChange();
                },
                createQueryContent: function () {
                },
                set: function (property, value) {
                    if (property === "minimum" || property === "maximum") {
                        if (property === "minimum") {
                            this.viewModel.currentMinValue(value);
                            this.applyBindings();
                        }
                        else {
                            this.viewModel.currentMaxValue(value);
                        }
                    }
                    else {
                        this.inherited(arguments);
                    }
                },
                getQueryArray: function () {
                    var where = [];
                    if (this.enabled) {
                        var currentValue;
                        if (this.viewModel.lessThanSelected()) {
                            var lessThanValue = this.viewModel.currentLessThanValue();
                            where.push(this.queryField + " < " + lessThanValue);

                        }
                        else if (this.viewModel.greaterThanSelected()) {
                            var greaterThanValue = this.viewModel.currentGreaterThanValue();
                            where.push(this.queryField + " > " + greaterThanValue);
                        }
                        else if (this.viewModel.rangeSelected()) {
                            var currentRangeMin = this.viewModel.currentMinRangeValue();
                            var currentRangeMax = this.viewModel.currentMaxRangeValue();
                            where.push(this.queryField + " >= " + currentRangeMin);
                            where.push(this.queryField + " <= " + currentRangeMax);
                        }
                    }
                    return where;
                },
                reset: function () {
                    this.viewModel.resetValues();
                    this.clearFilterFunction();
                },
                filterFunction: function (item) {
                    if (this.viewModel.lessThanSelected()) {
                        return item[this.queryField] < this.viewModel.currentLessThanValue();
                    }
                    else if (this.viewModel.greaterThanSelected()) {
                        return item[this.queryField] > this.viewModel.currentGreaterThanValue();
                    }
                    else if (this.viewModel.rangeSelected()) {
                        var val = item[this.queryField];
                        return item[this.queryField] >= this.viewModel.currentMinRangeValue() && item[this.queryField] <= this.viewModel.currentMaxRangeValue();
                    }
                    else {
                        return false;
                    }
                }
            });
    });