define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "esriviewer/loader/base/BaseViewerPlacement"

],
    function (declare, topic, lang, BaseViewerPlacement) {
        return declare(
            [BaseViewerPlacement], {
                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.PLACEMENT.GLOBAL.PLACE.DISCOVERY_WIDGET, lang.hitch(this, this.placeDiscoveryWidget));
                },
                placeDiscoveryWidget: function (discoveryWidget, title) {
                }
            });
    });