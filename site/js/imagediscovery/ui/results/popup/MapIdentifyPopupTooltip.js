define([
    "dojo/_base/declare",
    "dijit/popup",
    "dojo/dom-construct",
    "dijit/TooltipDialog",
    "./MapIdentifyPopupWidget",
    "dojo/_base/lang",
    "dojo/_base/window",
    "dojo/topic",
    "dojo/on"
],
    function (declare, popup, domConstruct, TooltipDialog, MapIdentifyPopupWidget, lang, window, topic, on) {
        return declare(
            [TooltipDialog],
            {
                constructor: function () {
                    this.initListeners();
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.identifyPopupContentWidget = new MapIdentifyPopupWidget();
                    //listen to the child for show so we the tooltip can be placed with it's full width
                    this.identifyPopupContentWidget.on("show", lang.hitch(this, this.showPopup));

                    var tooltipContents = domConstruct.create("div");
                    var closeContainer = domConstruct.create("div", {className: "mapIdentifyCloseContainer"});
                    var closeIcon = domConstruct.create("div", {className: "windowAction close mapIdentifyCloseIcon", title: "Close"});
                    on(closeIcon, "click", lang.hitch(this, this.handleClearIdentify));
                    domConstruct.place(closeIcon, closeContainer);
                    domConstruct.place(closeContainer, tooltipContents);
                    domConstruct.place(this.identifyPopupContentWidget.domNode, tooltipContents);

                    this.setContent(tooltipContents);
                },
                initListeners: function () {
                    var clearIdentifyScoped =  lang.hitch(this, this.handleClearIdentify);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR,clearIdentifyScoped );
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IDENTIFY.CLEAR, clearIdentifyScoped);
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.CHANGED, clearIdentifyScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IDENTIFY.STARTED, lang.hitch(this, this.handleIdentifyStarted));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.REFRESH_FOOTPRINTS_LAYER,clearIdentifyScoped);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.DISPLAYED,clearIdentifyScoped);


                },
                handleClearIdentify: function () {
                    this.identifyPopupContentWidget.clear();
                    this.hidePopup();
                },
                handleIdentifyStarted: function (id, screenCoordinates) {
                    this.hidePopup();
                    this.identifyPopupContentWidget.clear();
                    this.currentScreenCoordinates = screenCoordinates;
                    this.identifyPopupContentWidget.startIdentify(id);
                    if (this.currentPositionDiv) {
                        domConstruct.destroy(this.currentPositionDiv);
                        this.currentPositionDiv = null;
                    }
                },
                showPopup: function () {
                    if (this.currentScreenCoordinates == null) {
                        return;
                    }
                    //create small div to position the popup
                    if (this.currentPositionDiv) {
                        domConstruct.destroy(this.currentPositionDiv);

                    }
                    this.currentPositionDiv = domConstruct.create("div", {className: "mapIdentifyPositionDiv", style: {left: this.currentScreenCoordinates.x + "px", top: this.currentScreenCoordinates.y + "px"}});
                    domConstruct.place(this.currentPositionDiv, window.body());
                    popup.open({
                        popup: this,
                        around: this.currentPositionDiv

                    });
                },
                hidePopup: function () {
                    this.currentScreenCoordinates = null;
                    popup.close(this);

                }


            });

    });