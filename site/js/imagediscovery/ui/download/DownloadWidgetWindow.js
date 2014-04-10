define([
        "dojo/_base/declare",
        "dojo/topic",
        "dojo/_base/lang",
        "dojo/dom-class",
        "esriviewer/ui/window/WindowWidget"
    ],
    function (declare, topic, lang, domClass, WindowWidget) {
        return declare(
            [WindowWidget],
            {
                defaultPositioning: {
                    x: 200,
                    y: 50
                },
                windowWidth: "350px",
                windowHeaderText: "Data Download",
                windowIconAltText: "Data Download",
                positioningParamName: "download",
                windowIconClass: "commonIcons16 codePage",
                constructor: function () {
                    this.firstShowListener = this.on("firstWindowShow", lang.hitch(this, this.handleFirstWindowShow));
                },
                postCreate: function () {
                    this.inherited(arguments);
                    domClass.add(this.windowContent, "downloadWindowContent");
                },
                /**
                 * called on first window show. creates the inner download widget
                 */
                handleFirstWindowShow: function () {
                    this.firstShowListener.remove();
                    require(["imagediscovery/ui/download/DownloadWidget"], lang.hitch(this, function (DownloadWidget) {
                        this.downloadWidget = new DownloadWidget();
                        this.setContent(this.downloadWidget.domNode);
                    }));
                },
                initListeners: function () {
                    this.inherited(arguments);
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.DOWNLOAD.WINDOW.SHOW, lang.hitch(this, this.show)));
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.DOWNLOAD.WINDOW.HIDE, lang.hitch(this, this.hide)));
                    this.subscribes.push(topic.subscribe(IMAGERY_GLOBALS.EVENTS.DOWNLOAD.WINDOW.TOGGLE, lang.hitch(this, this.toggle)));
                    this.on("afterWindowHide", lang.hitch(this.handleWindowHidden));
                },
                handleWindowHidden: function () {
                    if (this.downloadWidget) {
                        //clear graphics on the map when the download widget is hidden
                        this.downloadWidget.clearActiveMapGraphics();
                    }
                }
            });
    });