define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esriviewer/ui/window/WindowWidget",
    "./ImageryExportDownloadListWidget"

],
    function (declare, lang, WindowWidget, ImageryExportDownloadListWidget) {
        return declare(
            [WindowWidget],
            {
                defaultPositioning: {
                    x: 200,
                    y: 50
                },
                windowWidth: "310px",
                windowHeaderText: "Your Files Have Been Prepared",
                windowIconAltText: "Your Files Have Been Prepared",
                positioningParamName: "downloadItems",
                windowIconClass: "commonIcons16 success",
                constructor: function (params) {
                    lang.mixin(this, params || {});
                },
                postCreate: function () {
                    this.inherited(arguments);
                    //create the download list widget
                    this.downloadListWidget = new ImageryExportDownloadListWidget();
                    this.setContent(this.downloadListWidget.domNode);
                },
                show: function (downloadList) {
                    if (downloadList != null) {
                        this.downloadListWidget.setDownloadList(downloadList);
                    }
                    this.inherited(arguments);
                },
                hide: function () {
                    if (this.downloadListWidget) {
                        this.downloadListWidget.clearDownloadList();
                    }
                    this.inherited(arguments);
                }
            });
    });