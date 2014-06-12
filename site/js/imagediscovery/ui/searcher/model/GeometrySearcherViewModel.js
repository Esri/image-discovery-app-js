define([
    "dojo/_base/declare",
    "dojo/Evented"
],
    function (declare, Evented) {
        return declare(
            [ Evented],
            {
                constructor: function () {
                    var self = this;
                    this.results = ko.observableArray();
                    this.searchCities = ko.observable(true);
                    this.searchStates = ko.observable(true);
                    this.searchText = ko.observable();
                    this.currentResultCount = ko.observable(0);
                    this.performSearch = function () {
                        self.emit("performSearch");
                    };
                    this.clearResults = function () {
                        self.emit("clearResults");
                    };
                    this.handleResultZoomTo = function (data) {
                        self.emit("zoomTo", data.geometry);
                    },
                    this.handleResultSearch = function (data) {
                        self.emit("searchGeometry", data.geometry);
                    }
                }

            });

    });