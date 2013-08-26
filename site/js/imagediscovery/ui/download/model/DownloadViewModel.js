define([
    "dojo/_base/declare"
],
    function (declare) {
        return declare(
            [],
            {
                constructor: function () {
                    this.showDownloadImageryTab = ko.observable(true);
                    this.webMapLabel = ko.observable("WebMap");
                    this.reportingLabel = ko.observable("Reporting");
                    this.footprintsLabel = ko.observable("Footprints");
                    this.downloadImageryLabel = ko.observable("Imagery");
                    this.reportingData = ko.observable(false);
                    this.downloadFootprintData = ko.observable(false);
                    this.downloadImageryData = ko.observable(true);
                    this.webMapCreation = ko.observable(false);
                    this.showWebMapCreationTab = ko.observable(true);
                },
                showReportingContent: function () {
                    this.reportingData(true);
                    this.downloadFootprintData(false);
                    this.downloadImageryData(false);
                    this.webMapCreation(false);
                },
                showDownloadFootprintsContent: function () {
                    this.reportingData(false);
                    this.downloadImageryData(false);
                    this.downloadFootprintData(true);
                    this.webMapCreation(false);
                },
                showDownloadImageryContent: function () {
                    this.reportingData(false);
                    this.downloadImageryData(true);
                    this.downloadFootprintData(false);
                    this.webMapCreation(false);
                },
                showCreateWebMapContent: function () {
                    this.reportingData(false);
                    this.downloadImageryData(false);
                    this.downloadFootprintData(false);
                    this.webMapCreation(true);
                }

            });

    })
;