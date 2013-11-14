define([
    "dojo/_base/declare"
],
    function (declare) {
        return declare(
            [],
            {

                constructor: function () {
                    this.bands = ko.observable(false);
                    this.raster = ko.observable(true);
                    this.mensuration = ko.observable(false);
                    //    this.miscOptions = ko.observable(false);
                },
                /*
                 showMiscOptions: function () {
                 this.raster(false);
                 this.bands(false);
                 this.mensuration(false);
                 this.miscOptions(true);
                 },
                 */
                showRaster: function () {
                    this.raster(true);
                    this.bands(false);
                    this.mensuration(false);
                    //    this.miscOptions(false);
                },
                showBands: function () {
                    this.bands(true);
                    this.raster(false);
                    this.mensuration(false);
                    //  this.miscOptions(false);

                },
                showMensuration: function () {
                    this.bands(false);
                    this.raster(false);
                    this.mensuration(true);
                    //    this.miscOptions(false);
                }
            });

    })
;