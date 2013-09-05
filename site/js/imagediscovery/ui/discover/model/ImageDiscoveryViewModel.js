define([
    "dojo/_base/declare" ,
    "dojo/Evented" ,
    "esri/tasks/GeometryService"
],
    function (declare, Evented, GeometryService) {
        return declare(
            [Evented],
            {

                VIEW_CHANGE: "viewChange",
                stepArrowIcon: require.toUrl("imagery/ui/discover/assets/images/stepArrow.png"),
                firstSearchByBoundsDisplay: true,
                views: {
                    extent: "extent",
                    point: "point",
                    rectangle: "rectangle",
                    bounds: "bounds",
                    upload: "upload",
                    none: "none"
                },
                selectToolText: ko.observable("Select a tool to discover imagery"),
                selectedPointUnits: ko.observable(""),

                pointGeometryUnits: ko.observableArray([
                    {
                        label: "Kilometers",
                        value: GeometryService.UNIT_KILOMETER
                    },
                    {
                        label: "Meters",
                        value: GeometryService.UNIT_METER
                    }

                ]),


                searchByGeometryButtonVisible: ko.observable(true),
                constructor: function () {
                    var self = this;
                    this.selectSearchServiceVisible = ko.observable(false);
                    this.discoveryServicesList = ko.observableArray();
                    this.selectedDiscoveryService = ko.observable(null);
                    this.discoverByFieldsHeaderVisible = ko.observable(false);
                    this.discoverByFieldsExpanded = ko.observable(false);
                    this.discoverByGeometryExpanded = ko.observable(true);
                    this.currentView = ko.observable(this.views.none);
                    this.showPointAdvancedOptions = ko.observable(false);
                },
                togglePointAdvancedOptions: function () {
                    this.showPointAdvancedOptions(!this.showPointAdvancedOptions());
                },
                toggleDiscoverByFields: function () {
                    this.discoverByFieldsExpanded(!this.discoverByFieldsExpanded());

                },
                toggleDiscoverByGeometry: function () {
                    this.discoverByGeometryExpanded(!this.discoverByGeometryExpanded());
                },
                isCurrentView: function (type) {
                    return this.currentView() == type;
                },
                toggleGeometryUploadContent: function () {
                    this._toggleView(this.views.upload);
                },
                toggleSearchAtPoint: function () {
                    this._toggleView(this.views.point);
                },
                toggleSearchByRectangle: function () {
                    this._toggleView(this.views.rectangle);
                },
                toggleSearchByBounds: function () {
                    if (this.currentView() != this.views.bounds) {
                        if (this.firstSearchByBoundsDisplay) {
                            this.emit("firstBoundsDisplay");
                            this.firstSearchByBoundsDisplay = false;
                        }

                    }
                    this._toggleView(this.views.bounds);
                },
                _toggleView: function (view) {
                    var oldView = this.currentView();
                    var newView;
                    if (this.currentView() == view) {
                        newView = this.views.none;
                        this.currentView();
                    }
                    else {
                        newView = view;
                    }
                    this.currentView(newView);
                    this.emit(this.VIEW_CHANGE, oldView, newView);

                },
                searchByExtentClick: function () {
                    var oldView = this.currentView();
                    this.currentView(this.views.extent);
                    this.emit(this.VIEW_CHANGE, oldView, this.views.extent);
                }
            });

    })
;