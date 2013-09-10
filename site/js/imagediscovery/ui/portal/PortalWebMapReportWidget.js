define([
    "dojo/_base/declare",
    "dojo/topic",
    "esriviewer/ui/portal/PortalPublisherWidget"
],
    function (declare, topic, PortalPublisherWidget) {
        return declare(
            [PortalPublisherWidget],
            {
                /**
                 * returns discovery application catalog layers for web map report
                 * @return {Array}
                 */
                getExternalLayers: function () {
                    var catalogLayers = [];
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (layerControllers) {
                        for (var i = 0; i < layerControllers.length; i++) {
                            catalogLayers.push(layerControllers[i].layer)
                        }
                    });
                    return catalogLayers;
                }
            });
    });