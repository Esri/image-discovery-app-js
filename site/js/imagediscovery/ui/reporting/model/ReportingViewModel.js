define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array"
],
    function (declare, lang, array) {
        return declare(
            [],
            {
                PDF: "PDF",
                HTML: "HTML",
                exportImageReportFormats: ["jpg", "jpgpng", "png8", "png24"],
                draw: "draw",
                viewerExtent: "viewerExtent",
                constructor: function () {
                    var self = this;
                    this.extentLabel = ko.observable("Clip Extent:");
                    this.selectedExtractMode = ko.observable("");
                    this.userDrawActive = ko.observable(false);
                    this.extractModes = ko.observableArray();
                    this.extractModes.push({label: "Current Extent", value: this.viewerExtent});
                    this.extractModes.push({label: "User Defined", value: this.draw});
                    this.selectedReportFormat = ko.observable("");
                    this.reportFormat = ko.observableArray([
                        {label: this.HTML, value: this.HTML}//,
                        //todo: iteration 2  {label: this.PDF, value: this.PDF},
                        /*  { label: "JPG", value: "jpg"},
                         { label: "JPGPNG", value: "jpgpng"},
                         { label: "PNG8", value: "png8"},
                         { label: "PNG24", value: "png24"}   */

                    ]);
                    var isDrawModeAnon = function () {
                        return self.selectedExtractMode() == self.draw;
                    };
                    this.isDrawMode = ko.computed(isDrawModeAnon);
                    this.selectedExtractMode.subscribe(lang.hitch(this, this.handleExtractModeChange));

                },
                handleExtractModeChange: function (value) {
                    if (value === this.viewerExtent) {
                        this.userDrawActive(false);
                    }
                },
                toggleUserDraw: function () {
                    this.userDrawActive(!this.userDrawActive());

                },
                isReportFormatImageExport: function () {
                    return array.indexOf(this.exportImageReportFormats, this.selectedReportFormat()) > -1;
                }
            });
    });