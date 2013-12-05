define([
    "dojo/_base/declare"
],
    function (declare) {
        return declare(
            [ ],
            {
                constructor: function () {
                    this.cloudCoverValue = ko.observable(0);
                    this.gsdValue = ko.observable(0);
                    this.gsdLabel = ko.observable("m");
                    this.showSensor = ko.observable(true);
                    this.selectedSensor = ko.observable();
                    this.sensorOptions = ko.observableArray([
                        {label: "Landsat-7-ETM+", value: "Landsat-7-ETM+"},
                        {label: "Landsat-5-TM", value: "Landsat-5-TM"},
                        {label: "Landsat-1-MSS", value: "Landsat-1-MSS"}
                    ]);
                }

            });
    });