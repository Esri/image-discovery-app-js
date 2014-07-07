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
                    this.pdfTemplateLabel =  ko.observable("Layout Template:");
                    this.extentLabel = ko.observable("Clip Extent:");
                    this.selectedExtractMode = ko.observable("");
                    this.userDrawActive = ko.observable(false);
                    this.extractModes = ko.observableArray();
                    this.extractModes.push({label: "Current Extent", value: this.viewerExtent});
                    this.extractModes.push({label: "User Defined", value: this.draw});
                    this.selectedReportFormat = ko.observable("");

                    this.pdfTitleLabel =  ko.observable("Title:");
                    this.pdfTitle = ko.observable("");

                    this.selectedPdfTemplate = ko.observable("");

                    this.pdfLayoutTemplates = ko.observableArray([
                        {label: "A3 Landscape", value: "A3 Landscape"},
                        {label: "A3 Portrait", value: "A3 Portrait"},
                        {label: "A4 Landscape", value: "A4 Landscape"},
                        {label: "A4 Portrait", value: "A4 Portrait"},
                        {label: "Letter ANSI A Landscape", value: "Letter ANSI A Landscape"},
                        {label: "Letter ANSI A Portrait", value: "Letter ANSI A Portrait"},
                        {label: "Tabloid ANSI B Landscape", value: "Tabloid ANSI B Landscape"},
                        {label: "Tabloid ANSI B Portrait", value: "Tabloid ANSI B Portrait"}
                    ]);

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
                    this.htmlReportSelected = ko.computed(function () {
                        return self.selectedReportFormat() == self.HTML;
                    });
                    this.pdfReportSelected = ko.computed(function () {
                        return self.selectedReportFormat() == self.PDF;
                    });

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