define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "../../download/DownloadWidget",
    "./ShoppingCartDownloadFootprintsWidget",
    "../export/ShoppingCartImageryExportWidget"
],
    function (declare, topic, lang, DownloadWidget, ShoppingCartDownloadFootprintsWidget, ShoppingCartImageryExportWidget) {
        return declare(
            [DownloadWidget],
            {
                createExportWidget: function () {
                    this.imageryExportWidget = new ShoppingCartImageryExportWidget().placeAt(this.imageExportContainer);
                },
                createFootprintDownloadWidget: function () {
                    this.footprintExportWidget = new ShoppingCartDownloadFootprintsWidget().placeAt(this.downloadFootprintsContainer)
                }
            });
    });