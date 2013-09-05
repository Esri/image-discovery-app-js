define([
    "dojo/_base/declare",
    "../../download/DownloadWidgetWindow",
    "dojo/_base/lang"
],
    function (declare, DownloadWidgetWindow, lang) {
        return declare(
            [DownloadWidgetWindow],
            {
                windowHeaderText: "Checkout",
                windowIconAltText: "Checkout",
                positioningParamName: "download",
                windowIconClass: "commonIcons16 shoppingCartEmpty",
                handleFirstWindowShow: function () {
                    this.firstShowListener.remove();
                    require(["imagediscovery/ui/cart/download/ShoppingCartDownloadWidget"], lang.hitch(this, function (ShoppingCartDownloadWidget) {
                        this.downloadWidget = new ShoppingCartDownloadWidget();
                        this.setContent(this.downloadWidget.domNode);
                    }));
                }
            });
    });