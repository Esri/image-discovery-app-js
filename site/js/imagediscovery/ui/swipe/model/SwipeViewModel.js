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

                    this.swipeEnbled = new ko.observable(false);
                    this.swipeDisabled = new ko.observable(true);
                    this.swipeDisabledMessage = new ko.observable("Swipe disabled");

                },
                setSwipeDisabled: function (disabledMessage) {
                    this.swipeEnbled(false);
                    this.swipeDisabled(true);
                    this.swipeDisabledMessage(disabledMessage != null ? disabledMessage : "Swipe disabled");
                },
                setSwipeEnabled: function () {
                    this.swipeEnbled(true);
                    this.swipeDisabled(false);
                    this.swipeDisabledMessage("");
                }
            });
    });