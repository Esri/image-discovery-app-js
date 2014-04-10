define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "./base/ImageryViewerManager",
    "esriviewer/manager/ViewerManagerWindow",
    "../ui/manipulation/ImageManipulationWindowWidget",
    "../ui/swipe/SwipeWindowWidget",

    "dijit/MenuItem"
],
    function (declare, lang, topic, ImageryViewerManager, ViewerManagerWindow, ImageManipulationWindowWidget, SwipeWindowWidget, MenuItem) {
        return  declare(
            [ImageryViewerManager, ViewerManagerWindow],
            {

                /**
                 * creates the image manipulation widget window
                 */
                createImageManipulationWidget: function () {
                    //create the image manipulation widget.
                    this.imageManipulationWidget = new ImageManipulationWindowWidget();

                },
                /**
                 * creates the swipe widget
                 */
                createSwipeWidget: function () {
                    //create the swipe widget
                    this.swipeWindowWidget = new SwipeWindowWidget();
                },

                /**
                 *  add swipe widget to the tools dropdown
                 */
                createAddonTools: function () {
                    //only add on tool for the discovery viewer is the swip widget
                    this.inherited(arguments);
                    if (this.viewerConfig.swipeWidget != null && lang.isObject(this.viewerConfig.swipeWidget) && this.viewerConfig.swipeWidget.create) {
                        var menuItem = new MenuItem({
                            iconClass: "commonIcons16 slider",
                            label: "Swipe",
                            onClick: function () {
                                topic.publish(IMAGERY_GLOBALS.EVENTS.SWIPE.WINDOW.SHOW);
                            }
                        });
                        //fire event to add the swipe item to the tools dropdown
                        topic.publish(VIEWER_GLOBALS.EVENTS.TOOLS.MENU.ADD_TOOL, menuItem);
                    }
                }
            });
    });