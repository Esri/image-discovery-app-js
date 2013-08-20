define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/dom-class",
    "esriviewer/ui/window/WindowWidget",
    "./ImageManipulationManagerWidget"

],
    function (declare, topic, lang, domClass, WindowWidget, ImageManipulationManagerWidget) {
        return declare(
            [WindowWidget],
            {
                defaultPositioning: {
                    x: 200,
                    y: 50
                },
                windowWidth: "360px",
                windowHeaderText: "Analysis",
                windowIconAltText: "Analysis",
                positioningParamName: "analysis",
                windowIconClass: "imageryIcons analysis",
                constructor: function (params) {
                    lang.mixin(this, params || {});
                },
                initListeners: function () {
                    this.inherited(arguments);
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.WINDOW.SHOW, lang.hitch(this, this.show)));
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.WINDOW.HIDE, lang.hitch(this, this.hide)));
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.WINDOW.TOGGLE, lang.hitch(this, this.toggle)));
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.imageManipulationManagerWidget = this.createManipulationManager();
                    this.setContent(this.imageManipulationManagerWidget.domNode);
                    domClass.add(this.windowContent, "imageManipulationWindowContent");

                },
                createManipulationManager: function(){
                   return new ImageManipulationManagerWidget();
                },
                show: function () {
                    this.inherited(arguments);
                    if (this.imageManipulationManagerWidget) {
                        this.imageManipulationManagerWidget.show();
                    }
                },
                hide: function () {
                    this.inherited(arguments);
                    if (this.imageManipulationManagerWidget) {
                        this.imageManipulationManagerWidget.handleClearAllManipulations();
                        this.imageManipulationManagerWidget.cancelMensuration();
                    }
                }

            });
    });