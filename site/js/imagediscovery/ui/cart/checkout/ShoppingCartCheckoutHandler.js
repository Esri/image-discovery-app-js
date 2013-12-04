define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esriviewer/base/DataLoaderSupport",
    "../download/ShoppingCartDownloadWidgetWindow"
],
    /**
     * handles checkbox functionality of shopping cart
     * @param declare
     * @param topic
     * @param lang
     * @param DataLoaderSupport
     * @param ShoppingCartDownloadWidgetWindow
     * @return {*}
     */
        function (declare,  lang, DataLoaderSupport, ShoppingCartDownloadWidgetWindow) {
        return declare(
            [DataLoaderSupport],
            {
                constructor: function (params) {
                    lang.mixin(this, params || {});
                },
                /**
                 * creates and displays the download widget
                 */
                checkout: function () {
                    //on checkout make sure the shopping cart download widget exists
                    if (this.downloadWindowWidget == null) {
                        this.downloadWindowWidget = new ShoppingCartDownloadWidgetWindow();
                    }
                    this.downloadWindowWidget.show();
                },
                /**
                 * hides the download widget
                 */
                hide: function () {
                    //hide the download widget when the shopping cart checkout is hidden
                    if (this.downloadWindowWidget) {
                        this.downloadWindowWidget.hide();
                    }
                }
            })
    });