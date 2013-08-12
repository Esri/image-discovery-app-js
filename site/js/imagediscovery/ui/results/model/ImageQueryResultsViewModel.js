define([
    "dojo/_base/declare",
    "dojo/Evented",
    "dojo/topic"
],
    function (declare, Evented, topic) {
        return declare(
            [Evented],
            {
                CLEAR_DRAW: "clearDraw",
                //ACTIVATE_POINT_SELECT: "activatePointSelect",
                ACTIVATE_RECTANGLE_SELECT: "activateRectangleSelect",
                //ACTIVATE_SHOW_IMAGE_BY_POINT_SELECT: "activateShowImageByPointSelect",
                //ACTIVATE_SHOW_IMAGE_BY_RECTANGLE_SELECT: "activateShowImageByRectangleSelect",
                SHRINK_GRID: "shrinkGrid",
                EXPAND_GRID: "expandGrid",
                cart: ko.observable(true),
                results: ko.observable(true),
                expanded: ko.observable(false),
                zoomToSelected: ko.observable(false),
                timeSlider: ko.observable(true),
                //pointSelectionActive: ko.observable(false),
                rectangleSelectionActive: ko.observable(false),
                //showImageByPointSelectionActive: ko.observable(false),
                //showImageByRectangleSelectionActive: ko.observable(false),
                reportIcon: ko.observable(false),
                filterIcon: ko.observable(false),
                toolsActive: ko.observable(false),
                resultCount: ko.observable(0),
                drawActive: ko.observable(false),
                forceSourceFilterHide: ko.observable(false),
                constructor: function () {
                    var self = this;
                    var showTrashIconAnon = function () {
                        return  self.results() && self.resultCount() > 0;
                    };
                    this.showTrashIcon = ko.computed(showTrashIconAnon);
                    var showTimeSliderAnon = function () {
                        return self.results() && self.timeSlider() && self.resultCount() > 0;
                    };
                    this.showTimeSlider = ko.computed(showTimeSliderAnon);

                    var showSourcesIconAnon = function () {
                        return  self.results() && !self.forceSourceFilterHide();
                    };
                    this.showSourcesIcon = ko.computed(showSourcesIconAnon);


                    var showFilterResetIconAnon = function () {
                        return  self.filterIcon() && self.results();
                    };
                    this.showFilterResetIcon = ko.computed(showFilterResetIconAnon);
                    var resultsVisibleAndHasResults = function () {
                        return self.results() && self.resultCount() > 0;
                    };
                    this.resultsVisibleAndHasResults = ko.computed(resultsVisibleAndHasResults);
                    var resultLblAnon = function () {
                        return self.resultCount() != 1 ? "s" : "";
                    };
                    this.resultAppend = ko.computed(resultLblAnon);
                },
                toggleGrid: function () {
                    if (this.cart()) {
                        this.results(true);
                        this.cart(false);
                    }
                    else {
                        this.cart(true);
                        this.results(false);
                    }
                },
                gridLabel: function () {
                    return this.results() ? "Results" : "";
                },
                cartClick: function () {
                    this.cart(true);
                    this.results(false);
                },
                resultsClick: function () {
                    this.cart(false);
                    this.results(true);
                },
                toggleExpand: function () {
                    this.expanded(!this.expanded());
                },
                setFilterIconHidden: function () {
                    this.filterIcon(false);
                },
                setFilterIconVisible: function () {
                    this.filterIcon(true);
                },
                orderByLockRaster: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.ORDER_BY_LOCK_RASTER);
                },
                /*
                togglePointResultsSelection: function () {
                    var stateBeforeClear = this.pointSelectionActive();
                    this.emit(this.CLEAR_DRAW);
                    if (!stateBeforeClear) {
                        this.emit(this.ACTIVATE_POINT_SELECT);
                        this.drawActive(true);
                    }
                    this.pointSelectionActive(!stateBeforeClear);
                },*/
                toggleRectangleResultsSelection: function () {
                    var stateBeforeClear = this.rectangleSelectionActive();
                    this.emit(this.CLEAR_DRAW);
                    if (!stateBeforeClear) {
                        this.emit(this.ACTIVATE_RECTANGLE_SELECT);
                        this.drawActive(true);
                    }
                    this.rectangleSelectionActive(!stateBeforeClear);
                },
                /*
                showImageFromPointIntersect: function () {
                    var stateBeforeClear = this.showImageByPointSelectionActive();
                    this.emit(this.CLEAR_DRAW);
                    if (!stateBeforeClear) {
                        this.emit(this.ACTIVATE_SHOW_IMAGE_BY_POINT_SELECT);
                        this.drawActive(true);
                    }
                    this.showImageByPointSelectionActive(!stateBeforeClear);
                },
                showImageFromRectangleIntersect: function () {
                    var stateBeforeClear = this.showImageByRectangleSelectionActive();
                    this.emit(this.CLEAR_DRAW);
                    if (!stateBeforeClear) {
                        this.emit(this.ACTIVATE_SHOW_IMAGE_BY_RECTANGLE_SELECT);
                        this.drawActive(true);
                    }
                    this.showImageByRectangleSelectionActive(!stateBeforeClear);
                },
                */
                /*
                clearPointDraw: function () {
                    this.pointSelectionActive(false);
                },
                */
                clearRectangleDraw: function () {
                    this.rectangleSelectionActive(false);
                },
                /*
                clearShowImagePointDraw: function () {
                    this.showImageByPointSelectionActive(false);
                },
                clearShowImageRectangleDraw: function () {
                    this.showImageByRectangleSelectionActive(false);
                },
                */
                clearAllDraw: function () {
                    //this.clearPointDraw();
                    this.clearRectangleDraw();
                    //this.clearShowImagePointDraw();
                    //this.clearShowImageRectangleDraw();
                    this.drawActive(false);
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR_HIGHLIGHTED_RESULTS);

                },
                clearHighlights: function () {
                    this.emit(this.CLEAR_DRAW);
                }
            });
    });