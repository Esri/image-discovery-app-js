define([
    "dojo/_base/declare"
],
    function (declare) {
        return declare(
            [],
            {

                constructor: function () {
                    this.operationLabel = ko.observable("Operation: ");
                    this.showAreaAndPerimeterResults = ko.observable(false);
                    this.showDistanceResults = ko.observable(false);
                    this.showAzimuth = ko.observable(false);
                    this.areaValue = ko.observable("");
                    this.azimuthValue = ko.observable("");
                    this.perimeterValue = ko.observable("");
                    this.distanceOrHeightValue = ko.observable("");
                    this.uncertaintyValue = ko.observable("");
                    this.mensurationOptions = ko.observableArray();
                    this.selectedMensurationOption = ko.observable("");
                    this.mensurationNotSupported = ko.observable(true);
                    this.mensurationSupported = ko.observable(false);
                    this.mensurationTypeSelectEnabled = ko.observable(true);
                    this.distanceOrHeightLabel = ko.observable("");
                    this.uncertaintyLabel = ko.observable("Uncertainty:");
                    this.areaLabel = ko.observable("Area:");
                    this.perimeterLabel = ko.observable("Perimeter:");
                    this.azimuthLabel = ko.observable("Azimuth:")
                },
                setMensurationNotSupported: function () {
                    this.mensurationNotSupported(true);
                    this.mensurationSupported(false);
                },
                setMensurationSupported: function () {
                    this.mensurationNotSupported(false);
                    this.mensurationSupported(true);
                }
            });

    })
;