define([
    "dojo/_base/declare",
    "../../download/DownloadWidget",
    "./ShoppingCartDownloadFootprintsWidget",
    "../export/ShoppingCartImageryExportWidget"
],
    function (declare, DownloadWidget, ShoppingCartDownloadFootprintsWidget, ShoppingCartImageryExportWidget) {
        return declare(
            [DownloadWidget],
            {
                /**
                 * creates the imagery export widget
                 */
                createExportWidget: function () {
                    if (this.imageryExportWidget == null) {
                        this.imageryExportWidget = new ShoppingCartImageryExportWidget().placeAt(this.imageExportContainer);
                    }
                },
                /**
                 * creates the footprint download widget
                 */
                createFootprintDownloadWidget: function () {
                    if (this.footprintExportWidget == null) {
                        this.footprintExportWidget = new ShoppingCartDownloadFootprintsWidget().placeAt(this.downloadFootprintsContainer);
                    }
                }
            });
    });