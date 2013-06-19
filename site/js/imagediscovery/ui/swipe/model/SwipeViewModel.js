define([
    "dojo/_base/declare"
],
    function (declare) {
        return declare(
            [],
            {
                constructor: function () {
                    this.swipeLayers = new ko.observableArray();
                    this.selectedSwipeLayerId = new ko.observable();

                    this.useRefLayer = new ko.observable(false); // Initially not checked
                    this.selectedRefLayerId = new ko.observable();
                }
            });
    });