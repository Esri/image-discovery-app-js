define([
    "dojo/_base/declare"
],
    function (declare) {
        return declare(
            [],
            {
                constructor: function () {
                    this.downloadItemsList = ko.observableArray();
                }

            });

    })
;