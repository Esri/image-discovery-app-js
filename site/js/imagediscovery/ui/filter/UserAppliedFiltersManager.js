define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/on",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dijit/registry",
    "dojo/_base/array",
    "./UserAppliedFilterLockController",
    "./base/ImageFilterNumberRangeWidget",
    "./base/ImageFilterDateRangeWidget",
    "./base/ImageFilterStringListWidget"
],
    function (declare, topic, on, lang, domConstruct, domStyle, registry, array, UserAppliedFilterLockController, ImageFilterNumberRangeWidget, ImageFilterDateRangeWidget, ImageFilterStringListWidget) {
        return declare(
            [],
            {
                title: "Filter",
                blockFilterChanges: false,
                blockFilterApplyPublish: false,
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    //queryWidgetConfig
                    this.queryWidgets = [];
                    this.numberWidgets = [];
                    this.dateRangeWidgets = [];
                    this.stringListWidgets = [];
                    this.activeFilterFunctionLookup = {};
                    this.lastFilterStateBeforeDisable = [];
                    this.stringListTypes = [VIEWER_GLOBALS.ESRI_FIELD_TYPES.STRING];
                    this.sliderTypes = [VIEWER_GLOBALS.ESRI_FIELD_TYPES.DOUBLE, VIEWER_GLOBALS.ESRI_FIELD_TYPES.INTEGER, VIEWER_GLOBALS.ESRI_FIELD_TYPES.SMALL_INTEGER];
                    this.dateTypes = [VIEWER_GLOBALS.ESRI_FIELD_TYPES.DATE];

                    //create the lock controller
                    this.lockController = new UserAppliedFilterLockController();

                    //this is the hitched callback that user filters will check for pass/fail
                    this.processQueryFilterCallback = lang.hitch(this, this.processFilterQuery);

                    this.loadViewerConfigurationData();
                    this._initListeners();
                    this.startupFilterWidgets();
                },
                _initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.handleClearQueryResult));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.USER_DISABLE, lang.hitch(this, this.disableFilters));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.USER_ENABLE, lang.hitch(this, this.enableUserFilters));
                },
                loadViewerConfigurationData: function () {
                    var displayFieldsConfig;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageQueryResultDisplayFields", function (displayFieldsConf) {
                        displayFieldsConfig = displayFieldsConf;
                    });
                    if (displayFieldsConfig != null && lang.isObject(displayFieldsConfig)) {
                        this.resultFields = displayFieldsConfig;
                    }
                },
                startupFilterWidgets: function () {
                    var catalogLayers;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.GET_CATALOG_LAYERS, function (cLyrs) {
                        catalogLayers = cLyrs;
                    });
                    var i;
                    var currentFilterConfig;
                    var newWidget;
                    var widgetTypeLower;
                    var currentWidgetParams;
                    //create widgets from config
                    for (i = 0; i < this.resultFields.length; i++) {
                        newWidget = null;
                        currentFilterConfig = this.resultFields[i];
                        if (currentFilterConfig.filter == null || currentFilterConfig.filter.enable != true) {
                            continue;
                        }
                        var fieldType = null;
                        for (var j = 0; j < catalogLayers.length; j++) {
                            fieldType = VIEWER_UTILS.getFieldTypeFromLayer(currentFilterConfig.field, catalogLayers[j]);
                            if (fieldType != null) {
                                break;
                            }
                        }
                        if (fieldType == null) {
                            continue;
                        }
                        currentWidgetParams = {queryField: currentFilterConfig.field};
                        if (array.indexOf(this.sliderTypes, fieldType) > -1) {
                            if (currentFilterConfig.filter.unitsLabel != null && currentFilterConfig.filter.unitsLabel != "") {
                                currentWidgetParams.unitsLabel = currentFilterConfig.filter.unitsLabel;
                            }
                            newWidget = new ImageFilterNumberRangeWidget(currentWidgetParams);
                            this.numberWidgets.push(newWidget);
                        }
                        if (array.indexOf(this.stringListTypes, fieldType) > -1) {
                            newWidget = new ImageFilterStringListWidget(currentWidgetParams);
                            this.stringListWidgets.push(newWidget);
                        }
                        if (array.indexOf(this.dateTypes, fieldType) > -1) {
                            newWidget = new ImageFilterDateRangeWidget(currentWidgetParams);
                            this.dateRangeWidgets.push(newWidget);
                        }
                        if (newWidget) {
                            newWidget.on("applyFilterFunction", lang.hitch(this, this.handleFilterApply, newWidget));
                            newWidget.on("clearFilterFunction", lang.hitch(this, this.handleClearFilter, newWidget));
                            newWidget.hide();
                            this.queryWidgets.push(newWidget);
                            topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.ADDED, newWidget);
                        }

                    }
                },
                resetFilters: function () {
                    //we only want to apply the filter publish after all widgets have been reset
                    this.blockFilterApplyPublish = true;
                    for (var i = 0; i < this.queryWidgets.length; i++) {
                        this.queryWidgets[i].reset();
                    }
                    this.blockFilterApplyPublish = false;
                    //publish the filter update
                    this.updateQueryFilter();
                },
                enableUserFilters: function () {
                    var i;
                    var currentFilterWidgetStateObj;
                    if (this.lastFilterStateBeforeDisable && lang.isArray(this.lastFilterStateBeforeDisable)) {
                        {
                            for (i = 0; i < this.lastFilterStateBeforeDisable.length; i++) {
                                currentFilterWidgetStateObj = this.lastFilterStateBeforeDisable[i];
                                if (currentFilterWidgetStateObj.visible) {
                                    currentFilterWidgetStateObj.widget.show();
                                }

                            }
                            this.lastFilterStateBeforeDisable = [];
                        }
                    }
                },
                disableFilters: function () {
                    var currentFilterWidget;
                    this.lastFilterStateBeforeDisable = [];
                    for (var i = 0; i < this.queryWidgets.length; i++) {
                        currentFilterWidget = this.queryWidgets[i];
                        this.lastFilterStateBeforeDisable.push({widget: currentFilterWidget, visible: currentFilterWidget.visible });
                        currentFilterWidget.hide();
                    }
                },
                hideClearAllFiltersIcon: function () {
                },
                showClearAllFiltersIcon: function () {
                },
                handleClearQueryResult: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.BEFORE_CLEAR);
                    //hide all the filter widgets
                    for (var i = 0; i < this.queryWidgets.length; i++) {
                        try {
                            this.queryWidgets[i].hide();
                        }
                        catch (err) {
                        }
                    }

                    this.lastFilterStateBeforeDisable = [];
                    this.hideClearAllFiltersIcon();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.REMOVE_FILTER_FUNCTION, this.processQueryFilterCallback);
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.CLEARED);


                },
                clearSourceFilter: function () {

                },
                addSourceFilterEntry: function () {

                },
                setFeatures: function (features) {
                    this.blockFilterChanges = true;
                    this.clearAllFilters();
                    this.appendFilterRanges(features);
                    this.blockFilterChanges = false;
                },
                appendFilterRanges: function (features) {
                    var hasVisibleWidget = false;
                    var i, key, min, max;
                    var rangeLookup = {};
                    for (i = 0; i < this.queryWidgets.length; i++) {
                        rangeLookup[this.queryWidgets[i].queryField] = {};
                    }
                    var currentAttributes;
                    for (i = 0; i < features.length; i++) {
                        currentAttributes = features[i].attributes;
                        for (key in rangeLookup) {
                            if (currentAttributes[key] == null) {
                                currentAttributes[key] = "";
                            }
                            rangeLookup[key][currentAttributes[key]] = currentAttributes[key];
                        }
                    }

                    var rangeLookupAsArray = {};
                    //todo: maybe there is a better way to do this. depends if storing multiple values is better than filtering out dupes by using a object above
                    //convert objects to array
                    for (key in rangeLookup) {
                        rangeLookupAsArray[key] = [];
                        for (var innerKey in rangeLookup[key]) {
                            rangeLookupAsArray[key].push(rangeLookup[key][innerKey]);
                        }
                    }
                    //populate slider min/max/current
                    var currentWidget;
                    var currentRangeLookupArray;
                    for (i = 0; i < this.numberWidgets.length; i++) {
                        currentWidget = this.numberWidgets[i];
                        currentRangeLookupArray = rangeLookupAsArray[currentWidget.queryField];
                        //check for empty string
                        var emptyStrIdx = array.indexOf(currentRangeLookupArray, "");
                        if (emptyStrIdx > -1) {
                            currentRangeLookupArray.splice(emptyStrIdx, 1);
                        }
                        if (currentRangeLookupArray && currentRangeLookupArray.length > 1) {
                            currentWidget.show();
                            max = Math.max.apply(Math, currentRangeLookupArray);
                            min = Math.min.apply(Math, currentRangeLookupArray);
                            if (max < 0) {
                                max = 0;
                            }
                            if (min < 0) {
                                min = 0;
                            }
                            if (min === max) {
                                //hide the filter
                                currentWidget.hide();
                            }
                            else {
                                hasVisibleWidget = true;
                            }
                            currentWidget.set("maximum", max);
                            currentWidget.set("minimum", min);
                        }
                        else {
                            //hide the widget
                            currentWidget.hide();
                        }
                    }
                    var currentStringListArray;
                    //populate string list widgets
                    for (i = 0; i < this.stringListWidgets.length; i++) {
                        currentWidget = this.stringListWidgets[i];
                        currentStringListArray = rangeLookupAsArray[currentWidget.queryField];
                        if (currentStringListArray && currentStringListArray.length > 1) {
                            hasVisibleWidget = true;
                            currentWidget.show();
                            //sort
                            if (currentStringListArray.length > 1) {
                                currentStringListArray.sort();
                            }
                            currentWidget.stringListEntries = currentStringListArray;
                            currentWidget.createStringList();
                        }
                        else {
                            //hide the widget
                            currentWidget.hide();
                        }
                    }
                    //populate date range widgets
                    for (i = 0; i < this.dateRangeWidgets.length; i++) {
                        currentWidget = this.dateRangeWidgets[i];
                        currentRangeLookupArray = rangeLookupAsArray[currentWidget.queryField];
                        if (currentRangeLookupArray && currentRangeLookupArray.length > 1) {
                            currentWidget.show();
                            //add/subtract a day so we get the matching values for min and max
                            max = Math.max.apply(Math, currentRangeLookupArray);
                            min = Math.min.apply(Math, currentRangeLookupArray);

                            if (max < 0) {
                                max = 0;
                            }
                            if (min < 0) {
                                min = 0;
                            }
                            if (min === max) {
                                //hide the filter
                                currentWidget.hide();
                            }
                            else {
                                hasVisibleWidget = true;
                            }
                            //add a buffer to the dates


                            currentWidget.set("maximum", max);
                            currentWidget.set("minimum", min);
                        }
                        else {
                            //hide the widget
                            currentWidget.hide();
                        }
                    }

                    //see if there are visible widgets
                    if (hasVisibleWidget) {
                        this.showClearAllFiltersIcon();
                    }
                    else {
                        this.hideClearAllFiltersIcon();
                    }
                },
                clearAllFilters: function () {
                    this.activeFilterFunctionLookup = {};
                    this.lastFilterStateBeforeDisable = [];
                },
                handleFilterApply: function (target, filterFxn) {
                    if (!this.blockFilterChanges) {
                        this.activeFilterFunctionLookup[target] = filterFxn;
                        this.updateQueryFilter();
                    }
                },
                handleClearFilter: function (target) {
                    if (!this.blockFilterChanges) {
                        if (this.activeFilterFunctionLookup[target]) {
                            delete this.activeFilterFunctionLookup[target];
                            this.updateQueryFilter();
                        }
                    }
                },
                updateQueryFilter: function () {
                    if (!this.blockFilterApplyPublish) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.RELOAD_FILTER_FUNCTION, this.processQueryFilterCallback);
                    }
                },
                processFilterQuery: function (item) {
                    for (var key in this.activeFilterFunctionLookup) {
                        if (!this.activeFilterFunctionLookup[key](item)) {
                            return false;
                        }
                    }
                    return true;
                },
                disableSubmit: function () {
                    this.submitQueryButton.set("disabled", true);
                },
                enableSubmit: function () {
                    this.submitQueryButton.set("disabled", false);
                },
                getWhereClause: function () {
                    var where = [];
                    for (var i = 0; i < this.queryWidgets.length; i++) {
                        var queryWidgetWhereClauses = this.queryWidgets[i].getQueryArray();
                        where = where.concat(queryWidgetWhereClauses);
                    }
                    var where_clause = "";
                    if (where.length > 0) {
                        where_clause = "(" + where.join(") AND (") + ")";
                    }
                    return where_clause;
                }
            })
    })
;