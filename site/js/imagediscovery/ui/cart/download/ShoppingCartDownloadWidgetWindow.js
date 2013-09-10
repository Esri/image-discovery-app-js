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
                /**
                 * creates the shopping cart download widget on first show
                 */
                handleFirstWindowShow: function () {
                    this.firstShowListener.remove();
                    require(["imagediscovery/ui/cart/download/ShoppingCartDownloadWidget"], lang.hitch(this, function (ShoppingCartDownloadWidget) {
                        this.downloadWidget = new ShoppingCartDownloadWidget();
                        this.setContent(this.downloadWidget.domNode);
                    }));
                }
            });
    });