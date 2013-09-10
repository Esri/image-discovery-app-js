define([
    "dojo/_base/declare",
    "dojo/dom-style",
    "esriviewer/ui/base/UITemplatedWidget"
],
    function (declare, domStyle, UITemplatedWidget) {
        return declare(
            [ UITemplatedWidget],
            {
                boundsNumberBoxWidth: "5em",
                /**
                 * handles when values change
                 * @param valid  true when widget inputs are valid
                 */
                onValuesChanged: function (valid) {
                },
                /**
                 * returns the query geometry
                 * @return {null}
                 */
                getGeometry: function () {
                    return null;
                },
                /**
                 * returns true when the widgets inputs are valid
                 * @return {boolean}
                 */
                isValid: function () {
                    return true;
                },
                /**
                 * shows the widget
                 */
                show: function () {
                    domStyle.set(this.domNode, "display", "block");
                },
                /**
                 * hides the widget
                 */
                hide: function () {
                    domStyle.set(this.domNode, "display", "none");
                }
            });
    });