define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "../../export/FootprintsExportWidget"
],
    function (declare, topic, lang, FootprintsExportWidget) {
        return declare(
            [FootprintsExportWidget],
            {
                //retrieves the object ids for the items in the shopping cart grid
                getDownloadObjectIds: function () {
                    var objectIds = [];
                    //fire event to grid to get the object ids
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.GET_ADDED_OBJECT_IDS, function (objIdsArr) {
                        objectIds = objIdsArr;
                    });
                    if (objectIds == null || !lang.isArray(objectIds) || objectIds.length == 0) {
                        //nothing in the cart
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There is nothing in your cart");
                        VIEWER_UTILS.log("Could not download footprints. The cart is empty", VIEWER_GLOBALS.LOG_TYPE.WARNING);
                        return null;
                    }
                    return objectIds;
                }
            });
    });