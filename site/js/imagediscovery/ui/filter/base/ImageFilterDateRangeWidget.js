define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageFilterDateRangeWidgetTemplate.html",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/date/locale",
    "dojo/dom-construct",
    "./BaseImageryFilterWidget",
    "./ImageFilterDateTextBox"
],
    //date range filter widget
    function (declare, template, topic, lang, locale, domConstruct, BaseImageryFilterWidget, ImageFilterDateTextBox) {
        return declare(
            [BaseImageryFilterWidget],
            {
                dateTextInputWidth: "75%",
                //default formatters
                __defaultDisplayFormats: {
                    date: "MM/dd/yyyy"
                },
                displayFormats: {
                    date: "MM/dd/yyyy"
                },
                templateString: template,

                postCreate: function () {
                    this.inherited(arguments);
                    this.startDateTextBox.disabledCheckFunction = lang.hitch(this, this.handleCheckForDisabledDate);
                    this.endDateTextBox.disabledCheckFunction = lang.hitch(this, this.handleCheckForDisabledDate);
                },
                loadViewerConfigurationData: function () {
                    var resultsFormattingConfig = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "resultsFormatting", function (resultsFormattingConf) {
                        resultsFormattingConfig = resultsFormattingConf;
                    });
                    if (resultsFormattingConfig && lang.isObject(resultsFormattingConfig)) {
                        if (resultsFormattingConfig.displayFormats && lang.isObject(resultsFormattingConfig.displayFormats)) {
                            this.displayFormats = resultsFormattingConfig.displayFormats;
                        }
                    }
                },
                createQueryContent: function (params) {
                    var dateDisplayFormat = this.displayFormats && this.displayFormats.date ? this.displayFormats.date : this.__defaultDisplayFormats.date;
                    this.endDateTextBox = new ImageFilterDateTextBox({
                        style: {
                            width: this.dateTextInputWidth
                        },
                        constraints: {datePattern: dateDisplayFormat}
                    });
                    this.endDateTextBox.on("keyUp", lang.hitch(this, this.handleCheckValidEndDate));
                    this.endDateTextBox.on("change", lang.hitch(this, this.handleDateRangeChanged));
                    domConstruct.place(this.endDateTextBox.domNode, this.endDateTexboBoxContainer);

                    this.startDateTextBox = new ImageFilterDateTextBox({
                        style: {
                            width: this.dateTextInputWidth
                        },
                        constraints: {datePattern: dateDisplayFormat}
                    });
                    this.startDateTextBox.on("keyUp", lang.hitch(this, this.handleCheckValidEndDate));
                    this.startDateTextBox.on("change", lang.hitch(this, this.handleDateRangeChanged));
                    domConstruct.place(this.startDateTextBox.domNode, this.startDateTexboBoxContainer);
                },
                set: function (property, value) {
                    if (property === "minimum" || property === "maximum") {
                        var date = new Date(value);
                        if (property === "minimum") {
                            date.setHours(0);
                            date.setMinutes(0);
                            date.setSeconds(0);
                            this.currentMinimumAllowedDate = date;
                            this.startDateTextBox.set("value", date);

                        }
                        else {
                            date.setHours(23);
                            date.setMinutes(59);
                            date.setSeconds(59);
                            this.currentMaximumAllowedDate = date;
                            this.endDateTextBox.set("value", date);
                        }
                    }
                    else {
                        this.inherited(arguments);
                    }
                },
                handleCheckForDisabledDate: function (date) {
                    var lessThan = (date - this.currentMinimumAllowedDate < 0);
                    var greaterThan = (this.currentMaximumAllowedDate - date < 0);
                    return  greaterThan || lessThan;
                },
                handleCheckValidStartDate: function () {
                    var startDate = this.startDateTextBox.get("value");
                    if (startDate) {
                        if (startDate >= this.currentMinimumAllowedDate) {
                            var startDateSeconds = startDate.getTime();
                            if (this.currentStartDateTime != null && startDateSeconds != this.currentEndDateTime) {
                                this.currentStartDateTime = startDateSeconds;
                                this.applyFilterFunctionChange();
                            }
                        }
                    }
                },
                handleCheckValidEndDate: function () {
                    var endDate = this.endDateTextBox.get("value");
                    if (endDate) {
                        if (endDate >= this.currentMaximumAllowedDate) {
                            var endDateSeconds = endDate.getTime();
                            if (this.currentEndDateTime != null && endDateSeconds != this.currentEndDateTime) {
                                this.currentEndDateTime = endDateSeconds;
                                this.applyFilterFunctionChange();
                            }
                        }
                    }
                },
                handleDateRangeChanged: function (value) {
                    if (this.isDefaultState()) {
                        this.clearFilterFunction();
                    }
                    else {
                        var startDate = this.startDateTextBox.get("value");
                        var endDate = this.endDateTextBox.get("value");
                        this.currentStartDateTime = startDate.getTime();
                        this.currentEndDateTime = endDate.getTime();
                        this.applyFilterFunctionChange();
                    }
                },
                reset: function () {
                    this.resetStartDate();
                    this.resetEndDate();
                    this.inherited(arguments);
                },
                resetStartDate: function () {
                    this.startDateTextBox.set("value", this.currentMinimumAllowedDate);
                },
                resetEndDate: function () {
                    this.endDateTextBox.set("value", this.currentMaximumAllowedDate);
                },
                formatDate: function (date) {
                    try {
                        var formatter = this.displayFormats.date != null ? this.displayFormats.date : this.__defaultDisplayFormats.date;
                        return locale.format(date, {selector: "date", datePattern: formatter});
                    }
                    catch (err) {
                        return null;
                    }
                },
                filterFunction: function (item) {
                    var good = item[this.queryField] >= this.currentStartDateTime && item[this.queryField] <= this.currentEndDateTime;
                    if (!good) {
                    }
                    return good;
                },
                isDefaultState: function () {
                    var startDate = this.startDateTextBox.get("value");
                    var endDate = this.endDateTextBox.get("value");

                    if (startDate && endDate) {
                        //todo: this can be optimized
                        var currentStartM = startDate.getMonth();
                        var currentStartD = startDate.getDay();
                        var currentStartYear = startDate.getFullYear();

                        var startCompareM = this.currentMinimumAllowedDate.getMonth();
                        var startCompareD = this.currentMinimumAllowedDate.getDay();
                        var startCompareYear = this.currentMinimumAllowedDate.getFullYear();


                        var currentEndM = endDate.getMonth();
                        var currentEndD = endDate.getDay();
                        var currentEndYear = endDate.getFullYear();

                        var endCompareM = this.currentMaximumAllowedDate.getMonth();
                        var endCompareD = this.currentMaximumAllowedDate.getDay();
                        var endCompareYear = this.currentMaximumAllowedDate.getFullYear();
                        return (currentStartM == startCompareM && currentStartD == startCompareD && currentStartYear == startCompareYear &&
                            currentEndM == endCompareM && currentEndD == endCompareD && currentEndYear == endCompareYear
                            );
                    }
                    else {
                        return true;
                    }
                }

            });
    });