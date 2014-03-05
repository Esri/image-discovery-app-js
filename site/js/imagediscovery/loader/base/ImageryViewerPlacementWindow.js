define([
    "dojo/_base/declare",
    "dojo/topic",
    "esriviewer/loader/base/ViewerPlacementWindow",
    "./BaseImageryViewerPlacement"

],
    function (declare, topic, ViewerPlacementWindow, BaseImageryViewerPlacement) {
        return declare(
            [BaseImageryViewerPlacement, ViewerPlacementWindow],
            {

                placeSearcherWidget: function (searcherWidget) {
                    //fire event telling the loader to place the discovery widget
                    topic.publish(VIEWER_GLOBALS.EVENTS.TOOLS.ACCORDION.ADD_ITEM, searcherWidget);

                },

                /**
                 *  place the discovery widget into the core viewer tools accordion
                 */
                placeDiscoveryWidget: function (discoveryWidget) {
                  topic.publish(VIEWER_GLOBALS.EVENTS.TOOLS.ACCORDION.ADD_ITEM, discoveryWidget);
                }
            }
        );
    });