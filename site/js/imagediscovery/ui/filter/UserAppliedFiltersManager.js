define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/_base/array",
    "./UserAppliedFilterLockController",
    "./base/ImageFilterNumberRangeWidget",
    "./base/ImageFilterDateRangeWidget",
    "./base/ImageFilterStringFilteringSelectWidget"
],
    function (declare, topic, lang, array, UserAppliedFilterLockController, ImageFilterNumberRangeWidget, ImageFilterDateRangeWidget, ImageFilterStringFilteringSelectWidget) {
        return declare(
            [],
            {
                title: "Filter",
                blockFilterChanges: false,
                blockFilterApplyPublish: false,
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    this.filterFieldNames = [];
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
                    //clear filter on results cleared
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.handleClearQueryResult));
                    //listen for disable request
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.USER_DISABLE, lang.hitch(this, this.disableFilters));
                    //listen for enable request
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.USER_ENABLE, lang.hitch(this, this.enableUserFilters));
                },
                loadViewerConfigurationData: function () {
                    var displayFieldsConfig;
                    //get the display fields to check for filters that will be enabled
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageQueryResultDisplayFields", function (displayFieldsConf) {
                        displayFieldsConfig = displayFieldsConf;
                    });
                    if (displayFieldsConfig != null && lang.isObject(displayFieldsConfig)) {
                        this.resultFields = displayFieldsConfig;
                    }
                },
                /**
                 * reads the fields to filter from configuration and creates filter widgets for each enabled grid column
                 */
                startupFilterWidgets: function () {
                    var queryLayerControllers;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (qLyrCts) {
                        queryLayerControllers = qLyrCts;
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
                        for (var j = 0; j < queryLayerControllers.length; j++) {
                            fieldType = IMAGERY_UTILS.getFieldTypeFromQueryLayerController(currentFilterConfig.field, queryLayerControllers[j]);
                            if (fieldType != null) {
                                break;
                            }
                        }
                        if (fieldType == null) {
                            continue;
                        }
                        this.filterFieldNames.push(currentFilterConfig.field);
                        currentWidgetParams = {queryField: currentFilterConfig.field};
                        if (array.indexOf(this.sliderTypes, fieldType) > -1) {
                            if (currentFilterConfig.filter.unitsLabel != null && currentFilterConfig.filter.unitsLabel != "") {
                                currentWidgetParams.unitsLabel = currentFilterConfig.filter.unitsLabel;
                            }
                            //this field will use the number range filter
                            newWidget = new ImageFilterNumberRangeWidget(currentWidgetParams);
                            this.numberWidgets.push(newWidget);
                        }
                        if (array.indexOf(this.stringListTypes, fieldType) > -1) {
                            //this field will use the string filter
                            newWidget = new ImageFilterStringFilteringSelectWidget(currentWidgetParams);
                            this.stringListWidgets.push(newWidget);
                        }
                        if (array.indexOf(this.dateTypes, fieldType) > -1) {
                            //this field will use the date filter
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
                /**
                 * resets all the created filters
                 */
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
                /**
                 * enables the filters
                 */
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
                /**
                 * disables the filters
                 */
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
                /**
                 * called when query results are cleared. All filter functions are removed from the current application state
                 */
                handleClearQueryResult: function () {
                    //this resets all of the filters on query clear
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.BEFORE_CLEAR);
                    //hide all the filter widgets
                    for (var i = 0; i < this.queryWidgets.length; i++) {
                        try {
                            this.queryWidgets[i].hide();
                            this.queryWidgets[i].reset();
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
                /**
                 * initializes the filter ranges for all filters
                 */
                initializeFilterRanges: function () {
                    //this will query the result grid, retrieving the unique field value for each field that has filtering enabled
                    this.blockFilterChanges = true;
                    this.clearAllFilters();
                    //get the unique values for each filter column
                    var uniqueValuesLookup = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_UNIQUE_VISIBLE_ROW_ATTRIBUTES, this.filterFieldNames, function (unValLk) {
                        uniqueValuesLookup = unValLk;
                    });
                    this.appendFilterRanges(uniqueValuesLookup);
                    this.blockFilterChanges = false;
                },
                /**
                 * uses passed uniqueValuesLookup to create filter ranges for created filter widgets
                 * @param uniqueValuesLookup
                 */
                appendFilterRanges: function (uniqueValuesLookup) {
                    var hasVisibleWidget = false;
                    var i, key, min, max;
                    //populate slider min/max/current
                    var currentWidget;
                    var currentRangeLookupArray;
                    //loop through the number filter widgets and set the range
                    for (i = 0; i < this.numberWidgets.length; i++) {
                        currentWidget = this.numberWidgets[i];
                        currentRangeLookupArray = uniqueValuesLookup[currentWidget.queryField];
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
                    //populate string list widgets from the unique values
                    for (i = 0; i < this.stringListWidgets.length; i++) {
                        currentWidget = this.stringListWidgets[i];
                        currentStringListArray = uniqueValuesLookup[currentWidget.queryField];
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
                    //populate date range widgets from the unique values
                    for (i = 0; i < this.dateRangeWidgets.length; i++) {
                        currentWidget = this.dateRangeWidgets[i];
                        currentRangeLookupArray = uniqueValuesLookup[currentWidget.queryField];
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
                /**
                 * clears all filters
                 */
                clearAllFilters: function () {
                    this.activeFilterFunctionLookup = {};
                    this.lastFilterStateBeforeDisable = [];
                },
                /**
                 * applies the filter to the target
                 * @param target
                 * @param filterFxn
                 */
                handleFilterApply: function (target, filterFxn) {
                    //called when the filter need to be applied
                    if (!this.blockFilterChanges) {
                        this.activeFilterFunctionLookup[target] = filterFxn;
                        this.updateQueryFilter();
                    }
                },
                /**
                 * clears the filter target
                 * @param target
                 */
                handleClearFilter: function (target) {
                    //clears the filter
                    if (!this.blockFilterChanges) {
                        if (this.activeFilterFunctionLookup[target]) {
                            delete this.activeFilterFunctionLookup[target];
                            this.updateQueryFilter();
                        }
                    }
                },
                /**
                 * when called, fires an event to reload the current filter function
                 */
                updateQueryFilter: function () {
                    //this tells the result grid that it needs to reload the grid based on filter changes
                    if (!this.blockFilterApplyPublish) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.RELOAD_FILTER_FUNCTION, this.processQueryFilterCallback);
                    }
                },
                /**
                 * checks passed item to see if it passes all active filter functions
                 * @param item item to test against active filter functions
                 * @return {boolean}
                 */
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
                /**
                 * @description returns where clause for all active filter functions. I Don't know if this is used anywhere
                 * @return {string}
                 */
                getWhereClause: function () {
                    //this returns a where clause that is build from all the current states of the filters
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