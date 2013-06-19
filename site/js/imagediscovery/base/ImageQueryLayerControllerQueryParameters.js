define([
    "dojo/_base/declare" ,
    "dojo/_base/lang"
],
    function (declare, lang) {
        return declare(
            [],
            {
                whereClause: "",
                returnGeometry: false,
                constructor: function (params) {
                    this.queryLayerControllers = [];
                    this.outFields = null;
                    this.geometry = null;
                    this.callback = null;
                    this.errback = null;
                    lang.mixin(this, params || {});
                }
            });

    });