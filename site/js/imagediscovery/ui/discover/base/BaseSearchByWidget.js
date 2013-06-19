define([
    "dojo/_base/declare",
    "dojo/dom-style",
    "esriviewer/ui/base/UITemplatedWidget"
],
    function (declare, domStyle, UITemplatedWidget) {
        return declare(
            [ UITemplatedWidget],
            {
                boundsNumberBoxWidth:"5em",
                onValuesChanged:function (valid) {
                },
                getGeometry:function () {
                    return null;
                },
                isValid:function () {
                    return true;
                },
                show:function () {
                    domStyle.set(this.domNode, "display", "block");
                },
                hide:function () {
                    domStyle.set(this.domNode, "display", "none");
                }
            });
    });