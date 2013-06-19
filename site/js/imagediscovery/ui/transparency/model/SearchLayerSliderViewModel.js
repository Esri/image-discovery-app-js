define([
    "dojo/_base/declare"
],
    function (declare) {
        return declare(
            [], {

                constructor: function () {
                    this.layerName = new ko.observable();
                }

            });
    });


