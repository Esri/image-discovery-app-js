define([
    "dojo/_base/declare",
    "dojo/text!./template/NoContentTemplate.html",
    "dojo/dom-style",
    "esriviewer/ui/base/UITemplatedWidget"
],
    function (declare, template, domStyle, UITemplatedWidget) {
        return declare(
            [UITemplatedWidget],
            {
                blockOnChange: false,
                templateString: template,
                constructor: function () {
                    this.keyProperties = null;
                    this.layer = null;
                },
                show: function () {
                    domStyle.set(this.domNode, "display", "block");
                },
                hide: function () {
                    domStyle.set(this.domNode, "display", "none");
                },
                getBandOrder: function () {
                    return [];
                },
                setKeyProperties: function (keyProperties) {
                    this.keyProperties = keyProperties;
                },
                setQueryLayerController: function (queryLayerController) {
                    this.queryLayerController = queryLayerController;
                    if (this.queryLayerController && this.queryLayerController.layer) {
                        this.layer = this.queryLayerController.layer;
                    }
                },
                onChange: function () {

                }
            });

    });