/**
 *
 * @module esriimageryViewer/loader/base/ImageryViewerLoader
 * @description bootstrap for imagery viewer loader.
 * @extends {esriviewer/loader/ViewerLoader}
 */
define([
    "dojo/_base/declare",
    "xstyle/css!../theme/ImageryViewerTheme.css",
    //"xstyle/css!../ui/base/theme/imagerySpriteTheme.css",
    "dojo/has",
    "dojo/topic",
    "esriviewer/loader/ViewerLoader",
    "../base/ImageryGlobals",
    "../utils/ImageryUtils",
    "dojo/_base/lang",
    "./base/ImageryViewerPlacementWindow",
    "../manager/ImageryViewerManagerWindow",
    "xstyle/css"
],
   // function (declare, cssTheme, spriteTheme, has, topic, ViewerLoader, ImageryGlobals, ImageryUtils, lang, ImageryViewerPlacementWindow, ImageryViewerManagerWindow, Css) {
        function (declare, cssTheme,  has, topic, ViewerLoader, ImageryGlobals, ImageryUtils, lang, ImageryViewerPlacementWindow, ImageryViewerManagerWindow, Css) {
        return declare(
            [ViewerLoader],
            {
                /**
                 *  kicks off everything for the discovery viewer
                 */
                constructor: function () {
                    //load ie7 theme if necessary for css hacks
                    if (has("ie") == 7) {
                        this._listenForLoadIE7Theme();
                    }
                    window.IMAGERY_UTILS = new ImageryUtils();
                },
                /**
                 *  the main viewer UI. Widgets are displayed in floating windows
                 */
                createViewerPlacementWindow: function () {
                    //viewer placement is the first entry point that uses globals
                    if (window.IMAGERY_GLOBALS == null) {
                        window.IMAGERY_GLOBALS = this.createImageryGlobals();
                    }
                    this.viewPlacement = new ImageryViewerPlacementWindow();
                },
                /**
                 *  create imagery globals, includes event string defs.
                 */
                createImageryGlobals: function () {
                    return new ImageryGlobals();
                },
                /**
                 *  create viewer manager. Currently only windowed mode is supported
                 */
                createViewerManagerWindow: function () {
                    return new ImageryViewerManagerWindow(this.viewerConfigurationParameters);
                },
                /**
                 *  read passed configuration settings
                 */
                processConfigurationSettings: function () {
                    this.inherited(arguments);
                    this.viewerConfigurationParameters.useProxyForImageryQueryConfig = false;
                    //see if a configuration was passed in the url
                    if (this.windowQueryObject != null && lang.isObject(this.windowQueryObject)) {
                        if (this.windowQueryObject.imageQueryConfig != null) {
                            this.viewerConfigurationParameters.imageQueryConfigUrl = this.windowQueryObject.imageQueryConfig;
                            //load imagery config json cross domain?
                            this.viewerConfigurationParameters.useProxyForImageryQueryConfig = true;
                        }
                    }
                },
                /**
                 *  method is called by base viewer if IE7 is detected
                 */
                _listenForLoadIE7Theme: function () {
                    //listen for core UI load and load IE7 tweaks to the cascade uses the IE7 tweaks
                    topic.subscribe(VIEWER_GLOBALS.EVENTS.CSS.CORE_UI_THEME_LOADED, function () {
                        Css.load("imagediscovery/theme/ImageryViewerIE7Tweaks.css", require, function () {
                        });
                    });
                }
            });
    });