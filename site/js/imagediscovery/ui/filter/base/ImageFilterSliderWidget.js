define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageFilterSliderWidgetTemplate.html",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/dom-attr",
    "./BaseImageryFilterWidget",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRuleLabels",
    "dijit/form/HorizontalRule",
    "dijit/form/RadioButton"

],
    function (declare, template, domConstruct, lang, domAttr, BaseImageryFilterWidget, HorizontalSlider, HorizontalRuleLabels, HorizontalRule, RadioButton) {
        return declare(
            [BaseImageryFilterWidget],
            {
                intermediateChanges: true,
                defaultMin: 0,
                defaultMax: 10,
                defaultCurrent: 0,
                unitsLabel: "%",
                templateString: template,
                _createView: function () {
                    var wrapperDiv = domConstruct.create("div", {className: "imageryFilterSliderContainer"});
                    this.sliderContainer = domConstruct.create("div");
                    this.valueContainer = domConstruct.create("div", {className: "imageryFilterSliderValueContainer"});
                    this.valueDisplay = domConstruct.create("span", {innerHTML: this.defaultCurrent});
                    var unitsSpan = domConstruct.create("span", {className: "imageryFilterSliderValueUnitsContainer", innerHTML: this.unitsLabel});

                    domConstruct.place(this.sliderContainer, wrapperDiv);
                    domConstruct.place(this.valueContainer, wrapperDiv);
                    domConstruct.place(this.valueDisplay, this.valueContainer);
                    domConstruct.place(unitsSpan, this.valueContainer);

                    this.createSlider();
                    domConstruct.place(this.slider.domNode, this.sliderContainer);
                    return wrapperDiv;
                },
                createSlider: function () {
                    this.createSliderRule([this.defaultMin, this.defaultMax]);
                    this.slider = new HorizontalSlider({
                        value: this.defaultCurrent,
                        minimum: this.defaultMin,
                        maximum: this.defaultMax,
                        intermediateChanges: this.intermediateChanges,
                        showButtons: false

                    });
                    this.slider.on("change", lang.hitch(this, this.handleSliderChange));
                    return this.slider;
                },
                set: function (property, value) {
                    if (property === "minimum" || property === "value" || property === "maximum") {
                        this.slider.set(property, value);
                        if (property === "value") {
                            this.processCurrentValue();
                        }
                        return;
                    }
                    if (property === "rule") {
                        this.createSliderRule(value);
                    }
                    else {
                        this.inherited(arguments);
                    }
                },
                handleSliderChange: function (value) {
                    domAttr.set(this.valueDisplay, "innerHTML", Math.ceil(value));
                    this.processCurrentValue();
                },
                enableGreaterThanFilter: function () {
                    if (!domAttr.get(this.greaterThanRadioButton, "checked")) {
                        this.greaterThanRadioButton.set("checked", true);
                        //  domAttr.set(this.greaterThanRadioButton, "checked", false);
                    }
                },
                enableLessThanFilter: function () {
                    if (!domAttr.get(this.lessThanRadioButton, "checked")) {
                        this.lessThanRadioButton.set("checked", true);
                        // domAttr.set(this.lessThanRadioButton, "checked", false);
                    }
                },
                createSliderRule: function (minMaxArray) {
                    var min = minMaxArray[0];
                    var max = minMaxArray[1];
                    if (this.horizontalRuleLabels) {
                        this.horizontalRuleLabels.destroy();
                    }
                    if (this.horizontalRule) {
                        this.horizontalRule.destroy();
                    }
                    var middle = (max + min) / 2;
                    this.horizontalRuleLabels = new HorizontalRuleLabels({
                        container: "topDecoration",
                        style: 'height: 1.2em; font-weight: normal',
                        numericMargin: 1,
                        labels: [String(min), String((middle + min) / 2), String(middle), String((middle + max) / 2), String(max)]
                    }, domConstruct.create("div"));

                    this.horizontalRule = new HorizontalRule({
                        container: "topDecoration",
                        style: 'height: 5px; margin: 0 12px;'


                    }, domConstruct.create("div"));
                    domConstruct.place(this.horizontalRuleLabels.domNode, this.sliderRuleContainer);
                    domConstruct.place(this.horizontalRule.domNode, this.sliderRuleContainer);
                    this.horizontalRuleLabels.startup();
                    this.horizontalRule.startup();
                },
                processCurrentValue: function () {
                    var currentValue = Math.ceil(this.slider.get("value"));
                    if (currentValue != this.lastSliderUpValue) {
                        this.lastSliderUpValue = currentValue;
                        this.valueChange(this.lastSliderUpValue);
                    }
                },
                getQueryArray: function () {
                    var where = [];
                    if (this.enabled) {
                        var currentValue = this.slider.get("value");
                        try {
                            if (parseInt(currentValue) > 0 && parseInt(currentValue) < 10) {
                                where.push(this.queryField + " <= " + currentValue);
                            } else if (parseInt(currentValue) == 0) {
                                where.push(this.queryField + " = " + currentValue);
                            }
                        } catch (e) {
                        }
                    }
                    return where;
                },
                handleFilterDirectionChange: function (checked) {
                    if (checked) {
                        if (this.isDefaultState()) {
                            this.clearFilterFunction();
                        }
                        else {
                            this.applyFilterFunctionChange();
                        }

                    }
                },
                reset: function () {
                    this.set("value", this.slider.get("maximum"));
                    this.enableLessThanFilter();
                    this.inherited(arguments);
                },
                valueChange: function (newValue) {
                    if (this.isDefaultState()) {
                        this.clearFilterFunction();
                    }
                    else {
                        this.applyFilterFunctionChange();
                    }
                },

                filterFunction: function (item) {
                    if (this.lessThanRadioButton.get("checked")) {
                        return item[this.queryField] <= this.lastSliderUpValue;
                    }
                    else {
                        return item[this.queryField] >= this.lastSliderUpValue;
                    }
                },
                isDefaultState: function () {
                    var currentValue = Math.ceil(this.slider.get("value"));
                    if (this.lessThanRadioButton.get("checked")) {
                        return currentValue == this.slider.maximum;
                    }
                    else {
                        return currentValue == this.slider.minimum;
                    }
                }

            });

    });