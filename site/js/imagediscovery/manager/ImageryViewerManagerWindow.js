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
    "dijit/MenuItem"
],
    function (declare, lang, topic, on, domConstruct, ImageryViewerManager, ViewerManagerWindow, ImageManipulationWindowWidget, SwipeWindowWidget, MenuItem) {
        return  declare(
            [ImageryViewerManager, ViewerManagerWindow],
            {
                placeDiscoveryWidget: function (discoveryWidget) {
                    topic.publish(VIEWER_GLOBALS.EVENTS.TOOLS.ACCORDION.ADD_ITEM, discoveryWidget);
                },
                createImageManipulationWidget: function () {
                    this.imageManipulationWidget = new ImageManipulationWindowWidget();
                },
                createSwipeWidget: function () {
                    this.swipeWindowWidget = new SwipeWindowWidget();
                },
                processNavigationToolbarAddons: function () {
                    //create the discovery icon text
                    var accordToggleButtonWrapper = domConstruct.create("div", {className: "navigationTextWrapperHorizontal"});
                    var accordToggleButtonWrapperInner = domConstruct.create("span", {className: "navigationTextWrapperHorizontalInner"});
                    domConstruct.place(accordToggleButtonWrapperInner, accordToggleButtonWrapper);
                    var accordIcon = domConstruct.create("div", {className: "navigationHorizontalIcon imageryIcons discover"});
                    var accordToggleButton = domConstruct.create("span", {innerHTML: "Discover", className: "navigationHorizontalText"});
                    domConstruct.place(accordIcon, accordToggleButtonWrapperInner);
                    domConstruct.place(accordToggleButton, accordToggleButtonWrapperInner);
                    on(accordToggleButton, "click", lang.hitch(this, this.handleShowDiscovery));
                    domConstruct.place(accordToggleButtonWrapper, this.navigationToolbar.navigationToolbar, "first");


                    //create the exploit icon text
                    var analysisToggleButtonWrapper = domConstruct.create("div", {className: "navigationTextWrapperHorizontal"});
                    var analysisToggleButtonWrapperInner = domConstruct.create("span", {className: "navigationTextWrapperHorizontalInner"});
                    domConstruct.place(analysisToggleButtonWrapperInner, analysisToggleButtonWrapper);
                    var analysisIcon = domConstruct.create("div", {className: "navigationHorizontalIcon imageryIcons analysis"});
                    var exploitToggleButton = domConstruct.create("span", {innerHTML: "Analysis", className: "navigationHorizontalText"});
                    domConstruct.place(analysisIcon, analysisToggleButtonWrapperInner);
                    domConstruct.place(exploitToggleButton, analysisToggleButtonWrapperInner);
                    on(exploitToggleButton, "click", function () {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.MANIPULATION.WINDOW.TOGGLE);
                    });
                    domConstruct.place(analysisToggleButtonWrapper, accordToggleButtonWrapper, "after");
                },
                createAddonTools: function () {
                    this.inherited(arguments);
                    if (this.viewerConfig.swipeWidget != null && lang.isObject(this.viewerConfig.swipeWidget) && this.viewerConfig.swipeWidget.create) {
                        var menuItem = new MenuItem({
                            iconClass: "commonIcons16 slider",
                            label: "Swipe",
                            onClick: function () {
                                topic.publish(IMAGERY_GLOBALS.EVENTS.SWIPE.WINDOW.SHOW);
                            }
                        });
                        topic.publish(VIEWER_GLOBALS.EVENTS.TOOLS.MENU.ADD_TOOL, menuItem);
                    }
                }
            });
    });