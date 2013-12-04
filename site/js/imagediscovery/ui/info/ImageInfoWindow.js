define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/dom-class",
    "esriviewer/ui/window/WindowWidget",
    "./ImageInfoTabWidget"
],
    function (declare, lang, topic,  domClass, WindowWidget, ImageInfoTabWidget) {
        return declare(
            [WindowWidget],
            {
                defaultPositioning: {
                    x: 300,
                    y: 100
                },
                resizable: true,
                positioningParamName: "imageInfo",
                windowWidth: "30%",
                windowHeight: "57%",
                windowHeaderText: "Image Information",
                windowIconAltText: "Draw",
                windowIconClass: "commonIcons16 layer",
                minHeight: 350,
                minWidth: 370,
                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.HIDE, lang.hitch(this, this.hide));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.hide));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.IMAGE.INFO.SET_CONTENT_AND_SHOW, lang.hitch(this, this.show));
                },
                postCreate: function () {
                    domClass.add(this.domNode, "imageInfoWindow");
                    domClass.add(this.windowContent, "imageInfoContent");
                    this.inherited(arguments);
                    this.imageInfoTabContainer = new ImageInfoTabWidget();
                    this.setContent(this.imageInfoTabContainer.domNode);
                },
                show: function(imageInfoAndQueryLayerControllerArray) {
                    this.inherited(arguments);
                    this.imageInfoTabContainer.setImageInfos(imageInfoAndQueryLayerControllerArray);
                }
            });
    });