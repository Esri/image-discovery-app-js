define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "esriviewer/base/DataLoaderSupport",
    "../download/ShoppingCartDownloadWidgetWindow"
],
    function (declare, topic, lang, DataLoaderSupport, ShoppingCartDownloadWidgetWindow) {
        return declare(
            [DataLoaderSupport],
            {
                constructor: function (params) {
                    lang.mixin(this, params || {});
                },
                checkout: function () {
                    //on checkout make sure the shopping cart download widget exists
                    if (this.downloadWindowWidget == null) {
                        this.downloadWindowWidget = new ShoppingCartDownloadWidgetWindow();
                    }
                    this.downloadWindowWidget.show();
                },
                hide: function () {
                    //hide the download widget when the shopping cart checkout is hidden
                    if (this.downloadWindowWidget) {
                        this.downloadWindowWidget.hide();
                    }
                }
            })
    });