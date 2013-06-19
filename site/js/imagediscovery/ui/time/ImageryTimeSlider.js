define([
    "dojo/_base/declare",
    "dojo/text!./template/TimeSliderContentTemplate.html",
    "dojo/dom-style",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/dom-construct",
    "esri/TimeExtent",
    "esri/dijit/TimeSlider",
    "esriviewer/ui/time/TimeSliderWidget",
    "./model/ImageryTimeSliderViewModel"
],
    function (declare, template, domStyle, topic, lang, query, domConstruct, TimeExtent, TimeSlider, TimeSliderWidget, ImageryTimeSliderViewModel) {
        return declare(
            [TimeSliderWidget],
            {
                templateString: template,
                visible: false,
                resultsLockApplied: false,
                featureTypeLabel: "Imagery",
                postCreate: function () {
                    this.inherited(arguments);
                    this.queryControllerIdToTimeInfo = {};
                    this.viewModel.layersSelectContainerVisible(false);
                    this.viewModel.timeSliderLayerActionsVisible(false);
                    this.processFilterFunctionsAgainstItemCallback = lang.hitch(this, this.itemInCurrentTimeBounds);
                },
                createViewModel: function () {
                    this.viewModel = new ImageryTimeSliderViewModel();
                    this.viewModel.dayOnlyMode(true);
                    this.viewModel.disabled.subscribe(lang.hitch(this, this.handleViewModelDisableStateChange));
                },
                handleReloadSliders: function () {
                    this.applyBindings();
                    if (this.getInitialTimeSliderValues()) {
                        this.createTimeSlider();
                    }
                },
                applyResultsLock: function () {
                    if (!this.resultsLockApplied) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.ADD_USER_LOCK, this);
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.DISABLE_THUMBNAIL_CHECKBOXES);
                        this.resultsLockApplied = true;
                    }
                },
                clearResultsLock: function () {
                    if (this.resultsLockApplied) {
                        this.resultsLockApplied = false;
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.ENABLE_THUMBNAIL_CHECKBOXES);
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.REMOVE_USER_LOCK, this);
                    }
                },
                setQueryControllers: function (queryControllers) {
                    this.viewModel.disabled(false);
                    var currentLayer;
                    for (var i = 0; i < queryControllers.length; i++) {
                        currentLayer = queryControllers[i].layer;
                        if (currentLayer) {
                            if (currentLayer.timeInfo && currentLayer.timeInfo.endTimeField && currentLayer.timeInfo.startTimeField) {
                                this.currentEndTimeField = layer.timeInfo.endTimeField;
                                this.currentStartTimeField = layer.timeInfo.startTimeField;
                            }
                        }
                    }
                },
                createTimeSlider: function () {
                    var interval = this.viewModel.selectedInterval();
                    if (interval == null) {
                        return;
                    }
                    //  this.inherited(arguments);
                    if (this.currentTimeSlider) {
                        this.currentTimeSlider.destroy();
                    }
                    this.currentTimeSlider = null;
                    var startDate = new Date(this.startTime);
                    startDate.setHours(0);
                    startDate.setMinutes(0);
                    startDate.setSeconds(0);

                    var endDate = new Date(this.endTime);
                    endDate.setHours(23);
                    endDate.setMinutes(59);
                    endDate.setSeconds(59);

                    if (endDate < startDate) {
                        var tmpStart = startDate;
                        startDate = endDate;
                        endDate = tmpStart;
                    }
                    var timeExtent = new TimeExtent(startDate, endDate);
                    var sliderDomNode = domConstruct.create("div");
                    domConstruct.place(sliderDomNode, this.timeSlidersContainer);
                    this.currentTimeSlider = new TimeSlider({}, sliderDomNode);
                    this.currentTimeSlider._createHorizRule = function () {
                        return;
                    };
                    this.currentTimeSlider.on("timeExtentChange", lang.hitch(this, this.onTimeExtentChange));
                    domStyle.set(this.currentTimeSlider.domNode, "color", "white");
                    var useRangeSlider = this.viewModel.useRangeSlider();
                    this.currentTimeSlider.setThumbCount(useRangeSlider ? 2 : 1);
                    var intervalUnitsObject = this.viewModel.selectedUnits();
                    var intervalUnits = intervalUnitsObject.units;
                    if (intervalUnits == null || intervalUnits == "") {
                        this.currentTimeSlider.createTimeStopsByCount(timeExtent, interval);
                    }
                    else {
                        this.currentTimeSlider.createTimeStopsByTimeInterval(timeExtent, interval, intervalUnits);
                    }
                    if (useRangeSlider) {
                        this.currentTimeSlider.setThumbIndexes([0, interval - 1]);
                    }
                    this.currentTimeSlider.startup();
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.TIME.SET_MAP_TIME_SLIDER, this.currentTimeSlider);
                    //hide the play button
                    if (this.currentTimeSlider) {
                        var currentTimeExtent = this.currentTimeSlider.getCurrentTimeExtent();
                        this._setCurrentTimeExtent(currentTimeExtent);
                        this.currentTimeSlider.on("timeExtentChange", lang.hitch(this, this._setCurrentTimeExtent));
                        if (this.currentTimeSlider.playPauseBtn) {
                            domStyle.set(this.currentTimeSlider.playPauseBtn.domNode, "display", "none");
                        }
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.TIME.SET_MAP_TIME_SLIDER, this.currentTimeSlider);
                    }
                },
                _setCurrentTimeExtent: function (timeExtent) {
                    if (timeExtent == null) {
                        return;
                    }
                    //strip the hours/min/sec
                    var strippedStart = new Date(timeExtent.startTime.getTime());
                    strippedStart.setHours(0);
                    strippedStart.setMinutes(0);
                    strippedStart.setSeconds(0);
                    var strippedEnd = new Date(timeExtent.endTime.getTime());
                    strippedEnd.setHours(23);
                    strippedEnd.setMinutes(59);
                    strippedEnd.setSeconds(59);
                    this.currentStartTime = strippedStart.getTime();
                    this.currentEndTime = strippedEnd.getTime();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.RELOAD_FILTER_FUNCTION, this.processFilterFunctionsAgainstItemCallback);
                },
                getInitialTimeSliderValues: function () {
                    this.queryControllerIdToTimeInfo = {};
                    var queryLayerControllers;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (queryLayerCtrls) {
                        queryLayerControllers = queryLayerCtrls;
                    });
                    var currentLayer;
                    var allStartTimes = [];
                    var allEndTimes = [];
                    for (var i = 0; i < queryLayerControllers.length; i++) {
                        currentLayer = queryLayerControllers[i].layer;
                        if (currentLayer.timeInfo == null || currentLayer.timeInfo.startTimeField == null || currentLayer.timeInfo.endTimeField == null) {
                            continue;
                        }
                        this.queryControllerIdToTimeInfo[queryLayerControllers[i].id] = currentLayer.timeInfo;
                        var startTimeField = currentLayer.timeInfo.startTimeField;
                        var endTimeField = currentLayer.timeInfo.endTimeField;
                        var uniqueValuesParameters = [startTimeField];
                        if (startTimeField != endTimeField) {
                            uniqueValuesParameters.push(endTimeField);
                        }
                        var uniqueTimeValues;
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.GET_UNIQUE_VISIBLE_RASTER_ATTRIBUTES, uniqueValuesParameters, function (uniqueValues) {
                            uniqueTimeValues = uniqueValues;
                        });
                        allStartTimes = allStartTimes.concat(uniqueTimeValues[startTimeField]);
                        allEndTimes = allEndTimes.concat(uniqueTimeValues[endTimeField]);

                    }
                    //remove dupes in the array
                    allStartTimes = IMAGERY_UTILS.toUniqueValueArray(allStartTimes);
                    allEndTimes = IMAGERY_UTILS.toUniqueValueArray(allEndTimes);
                    if (allStartTimes.length == 0 || allEndTimes.length == 0) {
                        this.viewModel.disabledTimeSliderText(this.viewModel.notEnoughUniqueValues);
                        this.viewModel.disabled(true);
                        return false;
                    }
                    allStartTimes = VIEWER_UTILS.sortIntegerArray(allStartTimes);
                    this.startTime = allStartTimes[0];
                    allEndTimes = VIEWER_UTILS.sortIntegerArray(allEndTimes);
                    this.endTime = allEndTimes[allEndTimes.length - 1];

                    if (this.startTime == this.endTime) {
                        this.viewModel.disabledTimeSliderText(this.viewModel.notEnoughUniqueValues);
                        this.viewModel.disabled(true);
                        return false;
                    }
                    if (this.startTime > this.endTime) {
                        var tmpStartTime = this.startTime;
                        this.startTime = this.endTime;

                        this.endTime = tmpStartTime;
                    }
                    return true;
                },
                handleViewModelDisableStateChange: function (disabled) {
                    if (disabled) {
                        this.disable();
                    }
                },
                enable: function () {
                    var noSourcesLocked = true;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.HAS_NO_SOURCES_LOCKED, function (noSourcesLk) {
                        noSourcesLocked = noSourcesLk;
                    });
                    if (noSourcesLocked) {
                        this.viewModel.disabledTimeSliderText(this.viewModel.unsupportedRastersMessage);
                        this.viewModel.disabled(true);
                        this.clearResultsLock();
                    }
                    else {
                        this.viewModel.disabled(false);
                        this.handleReloadSliders();
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.RELOAD_FILTER_FUNCTION, this.processFilterFunctionsAgainstItemCallback);
                        this.applyResultsLock();
                    }
                },
                disable: function () {
                    this.disableMapSlider();
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.REMOVE_FILTER_FUNCTION, this.processFilterFunctionsAgainstItemCallback);
                    this.clearResultsLock();
                },
                //this is the filter that is hit by the results to display only results in the date range
                itemInCurrentTimeBounds: function (item) {
                    var timeInfoForItem = this.queryControllerIdToTimeInfo[item.queryControllerId];
                    if (timeInfoForItem == null) {
                        return false;
                    }
                    //only want results that have visible thumbnails
                    var itemStartTime = item[timeInfoForItem.startTimeField];
                    var itemEndTime = item[timeInfoForItem.endTimeField];
                    var isValid = !(itemStartTime < this.currentStartTime || itemEndTime > this.currentEndTime) && item.showThumbNail;
                    return  isValid;
                },
                show: function () {
                    if (!this.visible) {
                        this.visible = true;
                        domStyle.set(this.domNode, "display", "block");

                    }
                },
                hide: function () {
                    if (this.visible) {
                        this.visible = false;
                        domStyle.set(this.domNode, "display", "none");
                    }
                }
            });
    });