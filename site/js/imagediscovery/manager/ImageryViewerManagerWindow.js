define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/on",
    "dojo/dom-construct",
    "./base/ImageryViewerManager",
    "esriviewer/manager/ViewerManagerWindow",
    "../ui/manipulation/ImageManipulationWindowWidget",
    "../ui/swipe/SwipeWindowWidget",
    "dijit/MenuItem",
    "esriviewer/ui/toolbar/base/button/Button"
],
    function (declare, lang, topic, on, domConstruct, ImageryViewerManager, ViewerManagerWindow, ImageManipulationWindowWidget, SwipeWindowWidget, MenuItem, ToolbarButton) {
        return  declare(
            [ImageryViewerManager, ViewerManagerWindow],
            {

                placeDiscoveryWidget: function (discoveryWidget) {
                    //fire event telling the loader to place the discovery widget
                    topic.publish(VIEWER_GLOBALS.EVENTS.TOOLS.ACCORDION.ADD_ITEM, discoveryWidget);
                },
                createImageManipulationWidget: function () {
                    //create the image manipulation widget.
                    this.imageManipulationWidget = new ImageManipulationWindowWidget();
                },
                createSwipeWidget: function () {
                    //create the swipe widget
                    this.swipeWindowWidget = new SwipeWindowWidget();
                },
                processNavigationToolbarAddons: function () {
                    var accordionButton = new ToolbarButton({
                        buttonClass: "commonIcons16 binoculars",
                        buttonText: "Discover",
                        onClick: lang.hitch(this, this.handleShowDiscovery)
                    });
                    var analysisButton = new ToolbarButton({
                        buttonClass: "imageryIcons analysis",
                        buttonText: "Analysis",
                        onClick: lang.hitch(this, function () {
                            topic.publish(IMAGERY_GLOBALS.EVENTS.MANIPULATION.WINDOW.TOGGLE);
                        })
                    });
                    accordionButton.placeAt(this.navigationToolbar.navigationToolbar);
                    analysisButton.placeAt(this.navigationToolbar.navigationToolbar);
                },
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