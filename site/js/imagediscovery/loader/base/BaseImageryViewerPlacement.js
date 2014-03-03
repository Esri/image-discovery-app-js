define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "esriviewer/loader/base/BaseViewerPlacement"

],
    function (declare, topic, lang, BaseViewerPlacement) {
        return declare(
            [BaseViewerPlacement], {
                /**
                 *  listen for request to place discovery widget
                 */
                initListeners: function () {
                    this.inherited(arguments);
                    //listen for discovery widget placement
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.PLACEMENT.GLOBAL.PLACE.DISCOVERY_WIDGET, lang.hitch(this, this.placeDiscoveryWidget));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.PLACEMENT.GLOBAL.PLACE.SEARCHER_WIDGET, lang.hitch(this, this.placeSearcherWidget));
                },
                /**
                 *  must inherit in subclass. place the discoveryWidget somewhere in the DOM
                 */
                placeDiscoveryWidget: function (discoveryWidget, title) {
                },
                /**
                 *  must inherit in subclass. place the discoveryWidget somewhere in the DOM
                 */
                placeSearcherWidget: function (searcherWidget, title) {

                }
            });
    });