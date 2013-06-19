define([
    "dojo/_base/declare",
    "dojo/_base/lang"
],
    function (declare, lang) {
        return declare(
            [],
            {
                draw: "draw",
                viewerExtent: "viewerExtent",
                worldExtent: "allMapImages",

                constructor: function () {
                    var self = this;
                    this.userDrawActive = ko.observable(false);
                    this.formatLabel = ko.observable("Format:");
                    this.extentLabel = ko.observable("Clip Extent:");
                    this.selectedDownloadFormat = ko.observable("");
                    this.downloadFormats = ko.observableArray([
                        {label: "KMZ", value: "KMZ"},
                        {label: "SHP", value: "SHP"},
                        {label: "CSV", value: "CSV"}
                    ]);

                    this.selectedExtractMode = ko.observable("");
                    this.extractModes = ko.observableArray();
                    this.extractModes.push({label: "None", value: this.worldExtent});
                    this.extractModes.push({label: "Current Extent", value: this.viewerExtent});
                    this.extractModes.push({label: "User Defined", value: this.draw});

                    var isDrawModeAnon = function () {
                        return self.selectedExtractMode() == self.draw;
                    };
                    this.isDrawMode = ko.computed(isDrawModeAnon);


                    this.selectedExtractMode.subscribe(lang.hitch(this, this.handleExtractModeChange));
                },
                handleExtractModeChange: function (value) {
                    if (value === this.viewerExtent || value == this.allMapImages) {
                        this.userDrawActive(false);
                    }
                },
                toggleUserDraw: function () {
                    this.userDrawActive(!this.userDrawActive());

                }

            });

    })
;