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
                    if (this.downloadWindowWidget == null) {
                        this.downloadWindowWidget = new ShoppingCartDownloadWidgetWindow();
                    }
                    this.downloadWindowWidget.show();
                },
                hide: function () {
                    if (this.downloadWindowWidget) {
                        this.downloadWindowWidget.hide();
                    }
                }


            })
    });