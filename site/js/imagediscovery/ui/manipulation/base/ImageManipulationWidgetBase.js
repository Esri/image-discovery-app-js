define([
    "dojo/_base/declare",
    "esriviewer/ui/base/UITemplatedWidget"
],
    function (declare, UITemplatedWidget) {
        return declare(
            [ UITemplatedWidget],
            {
                constructor: function () {
                    this.keyProperties = null;
                    this.queryLayerController = null;
                    this.layer = null;
                },

                reset: function () {

                },
                setKeyProperties: function (keyProperties) {
                    this.keyProperties = keyProperties;
                },
                setQueryLayerController: function (queryLayerController) {
                    this.queryLayerController = queryLayerController;
                    if (this.queryLayerController != null && this.queryLayerController.layer) {
                        this.layer = this.queryLayerController.layer;
                    }
                }
            });
    });