define([
    "dojo/_base/declare",
    "dojo/text!./template/SearchByBoundsTemplate.html",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/dom-style",
    "esriviewer/ui/base/UITemplatedWidget",
    "esriviewer/ui/draw/base/MapDrawSupport",
    "./base/SearchByDecimalDegreesWidget",
    "./base/SearchByDMSWidget",
    "./base/SearchByUTMWidget",
    "./base/SearchByNSEWWidget",
    "./model/SearchByBoundsViewModel",
    "dijit/form/RadioButton",
    "dijit/form/Button"
],
    function (declare, template, topic, lang, domStyle, UITemplatedWidget, MapDrawSupport, SearchByDecimalDegreesWidget, SearchByDMSWidget, SearchByUTMWidget, SearchByNSEWWidget, SearchByBoundsViewModel,RadioButton,Button) {
        return declare(
            [UITemplatedWidget, MapDrawSupport],
            {
                templateString: template,

                postCreate: function () {
                    this.viewModel = new SearchByBoundsViewModel();
                    this.viewModel.on("viewChange", lang.hitch(this, this.handleViewChanged));
                    this.projectSearchByBoundsCallback = lang.hitch(this, this.handleSearchByBoundsProjectResponse);
                    this.projectSearchByBoundsErrback = lang.hitch(this, this.handleSearchByBoundsProjectError);
                    this.disableSearchByBoundsButton();
                    //set the default selected widget
                    this.currentVisibleWidget = this.searchByBoundsDecimalDegreeWidget;
                    ko.applyBindings(this.viewModel, this.domNode);
                    this.createSearchByWidgets();
                },
                handleViewChanged: function (view) {
                    if (view == this.viewModel.views.decimalDegree) {
                        this.currentVisibleWidget = this.searchByBoundsDecimalDegreeWidget;
                    }
                    else if (view == this.viewModel.views.degreeMinuteSeconds) {
                        this.currentVisibleWidget = this.searchByBoundsDMSWidget;
                    }
                    else if (view == this.viewModel.views.utm) {
                        this.currentVisibleWidget = this.searchByBoundsUTMWidget;
                    }
                    else if (view == this.viewModel.views.nsew) {
                        this.currentVisibleWidget = this.searchByBoundsNSEWWidget;
                    }
                    else {
                        this.currentVisibleWidget = null;
                    }
                    this.checkSubmitButtonEnabled();
                },
                createSearchByWidgets: function () {
                    var checkValidBoundsCallback = lang.hitch(this,this.handleCheckValidBoundsInput);

                    //decimal degree
                    this.searchByBoundsDecimalDegreeWidget = new SearchByDecimalDegreesWidget();
                    this.searchByBoundsDecimalDegreeWidget.on("valuesChanged", checkValidBoundsCallback);
                    this.searchByBoundsDecimalDegreeWidget.placeAt(this.decimalDegreesWidgetContainer);

                    //dms
                    this.searchByBoundsDMSWidget = new SearchByDMSWidget();
                    this.searchByBoundsDMSWidget.on("valuesChanged", checkValidBoundsCallback);
                    this.searchByBoundsDMSWidget.placeAt(this.dmsWidgetContainer);

                    //utm
                    this.searchByBoundsUTMWidget = new SearchByUTMWidget();
                    this.searchByBoundsUTMWidget.on("valuesChanged", checkValidBoundsCallback);
                    this.searchByBoundsUTMWidget.placeAt(this.utmWidgetContainer);

                    //nsew
                    this.searchByBoundsNSEWWidget = new SearchByNSEWWidget();
                    this.searchByBoundsNSEWWidget.on("valuesChanged", checkValidBoundsCallback);
                    this.searchByBoundsNSEWWidget.placeAt(this.nsewWidgetContainer);
                },
                checkSearchByBoundsUTMValid: function () {
                    return false;
                },
                handleCheckValidBoundsInput: function (valid) {
                    this.searchByBoundsSubmitButton.set("disabled", !valid);
                },
                checkSubmitButtonEnabled: function () {
                    if (this.currentVisibleWidget) {
                        this.searchByBoundsSubmitButton.set("disabled", !this.currentVisibleWidget.isValid());
                    }
                    else {
                        this.searchByBoundsSubmitButton.set("disabled", true);
                    }
                },
                enableSearchByBoundsButton: function () {
                    this.searchByBoundsSubmitButton.set("disabled", false);
                },
                disableSearchByBoundsButton: function () {
                    this.searchByBoundsSubmitButton.set("disabled", true);
                },
                handleSearchByBounds: function () {
                    var searchGeometry;
                    if (this.searchByBoundsFormatDMSRadio.get("checked")) {
                        searchGeometry = this.searchByBoundsDMSWidget.getGeometry();
                    }
                    else if (this.searchByBoundsFormatUTMRadio.get("checked")) {
                        searchGeometry = this.searchByBoundsUTMWidget.getGeometry();
                    }
                    else if (this.searchByBoundsFormatNSEWRadio.get("checked")) {
                        searchGeometry = this.searchByBoundsNSEWWidget.getGeometry();
                    }
                    else {
                        searchGeometry = this.searchByBoundsDecimalDegreeWidget.getGeometry();
                    }
                    if (searchGeometry == null) {
                        return;
                    }
                    topic.publish(VIEWER_GLOBALS.EVENTS.GEOMETRY_SERVICE.TASKS.PROJECT_TO_MAP_SR, searchGeometry, this.projectSearchByBoundsCallback, {}, this.projectSearchByBoundsErrback);
                },
                handleSearchByBoundsProjectResponse: function (geometries) {
                    if (geometries && lang.isArray(geometries) && geometries.length > 0) {
                        //search calls clear so add the graphic after starting the search
                        this.onBoundsGeometryCreated(geometries[0]);
                    }
                },
                handleSearchByBoundsProjectError: function (err) {
                },
                onBoundsGeometryCreated: function (boundsGeometry) {

                }
            });
    });