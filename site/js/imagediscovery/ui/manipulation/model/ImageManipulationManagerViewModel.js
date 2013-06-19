define([
    "dojo/_base/declare",
    "dojo/_base/lang"
],
    function (declare, lang) {
        return declare(
            [],
            {
                defaultDisabledText: "You must add imagery to the map",

                constructor: function () {

                    this.disabledText = ko.observable("");
                    this.manipulationContainer = ko.observable(false);
                    this.disabledContainer = ko.observable(true);

                    this.disabledText(this.defaultDisabledText);

                    this.manipulationContainer.subscribe(lang.hitch(this, function (visible) {
                        if (visible) {
                            this.disabledContainer(false);
                        }
                    }));
                    this.disabledContainer.subscribe(lang.hitch(this, function (visible) {
                        if (visible) {
                            this.manipulationContainer(false);
                        }
                    }));
                }


            });

    })
;