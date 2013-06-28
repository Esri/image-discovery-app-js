define([
    "dojo/_base/declare",
    "xstyle/css!../theme/ImageryViewerTheme.css",
    "xstyle/css!../ui/base/theme/imagerySpriteTheme.css",
    "dojo/has",
    "dojo/sniff",
    "dojo/topic",
    "dojo/Deferred",
    "esriviewer/loader/ViewerLoader",
    "../manager/base/ImageryViewerManager",
    "../base/ImageryGlobals",
    "../utils/ImageryUtils",
    "dojo/_base/lang",
    "./base/ImageryViewerPlacementWindow",
    "../manager/ImageryViewerManagerWindow",
    "xstyle/css"
],
    function (declare, cssTheme, spriteTheme, has, sniff, topic, Deferred, ViewerLoader, ImageryViewerManager, ImageryGlobals, ImageryUtils, lang, ImageryViewerPlacementWindow, ImageryViewerManagerWindow, Css) {
        return declare(
            [ViewerLoader],
            {
                constructor: function () {
                    if (has("ie") == 7) {
                        this._listenForLoadIE7Theme();
                    }
                    window.IMAGERY_UTILS = new ImageryUtils();
                },
                initViewerPlacement: function () {
                    if (window.IMAGERY_GLOBALS == null) {
                        window.IMAGERY_GLOBALS = this.createImageryGlobals();
                    }
                    return this.inherited(arguments);
                },
                _handleViewModePlacementRequireLoaded: function () {
                    this.inherited(arguments);
                },
                createViewerPlacementSidebar: function () {
                    //sidebar mode isn't fully implement in image discovery application
                    return this.createViewerPlacementWindow();
                },
                createViewerPlacementWindow: function () {
                    var deferred = new Deferred();
                    require(["imagediscovery/loader/base/ImageryViewerPlacementWindow"], lang.hitch(this, function (ImageryViewerPlacementWindow) {
                        this._handleViewModePlacementRequireLoaded(ImageryViewerPlacementWindow);
                        deferred.resolve("success");
                    }));
                    return deferred.promise;
                },
                createImageryGlobals: function () {
                    return new ImageryGlobals();
                },
                createViewerManagerSidebar: function () {
                    //sidebar mode isn't fully implement in image discovery application
                    this.createViewerManagerWindow(this.viewerConfigurationParameters);
                },
                createViewerManagerWindow: function () {
                    return new ImageryViewerManagerWindow(this.viewerConfigurationParameters);
                },
                processConfigurationSettings: function () {
                    this.inherited(arguments);
                    this.viewerConfigurationParameters.useProxyForImageryQueryConfig = false;
                    if (this.windowQueryObject != null && lang.isObject(this.windowQueryObject)) {
                        if (this.windowQueryObject.imageQueryConfig != null) {
                            this.viewerConfigurationParameters.imageQueryConfigUrl = this.windowQueryObject.imageQueryConfig;
                            this.viewerConfigurationParameters.useProxyForImageryQueryConfig = true;
                        }
                    }
                },
                _listenForLoadIE7Theme: function () {
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.CSS.CORE_UI_THEME_LOADED, function () {
                        Css.load("imagediscovery/theme/ImageryViewerIE7Tweaks.css", require, function () {
                        });
                    });
                }
            });
    });