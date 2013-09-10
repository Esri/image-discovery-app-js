define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "../../export/ImageryExportWidget"
],
    /**
     * creates the imagery export widget for the shopping cart
     * @param declare
     * @param topic
     * @param lang
     * @param ImageryExportWidget
     * @return {*}
     */
        function (declare, topic, lang, ImageryExportWidget) {
        return declare(
            [ImageryExportWidget],
            {
                //title to display for the window
                imageryExportDownloadWindowTitle: "Checkout Complete",
                /**
                 * gets the object ids to checkout in the shopping cart
                 * @return {*}
                 */
                getDownloadObjectIds: function () {
                    var objectIds = [];
                    //get object ids from the shopping cart grid
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.GET_ADDED_OBJECT_IDS, function (objIdsArr) {
                        objectIds = objIdsArr;
                    });
                    if (objectIds == null || !lang.isArray(objectIds) || objectIds.length == 0) {
                        //nothing in the cart
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There is nothing in your cart");
                        VIEWER_UTILS.log("Could not download cart. The cart is empty", VIEWER_GLOBALS.LOG_TYPE.WARNING);

                        //clear the imagery export download window
                        if (this.imageryExportDownloadWindow &&
                            this.imageryExportDownloadWindow.downloadListWidget
                            ) {
                            this.imageryExportDownloadWindow.downloadListWidget.clearDownloadList();
                        }
                        return null;
                    }
                    return objectIds;
                }
            });
    });