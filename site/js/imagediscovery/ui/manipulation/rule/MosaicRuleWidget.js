define([
    "dojo/_base/declare",
    "dojo/text!./template/MosaicRuleTemplate.html",
    "esriviewer/ui/base/UITemplatedWidget",
    "dijit/form/Select"
],
    function (declare, template, UITemplatedWidget, Select) {
        return declare(
            [ UITemplatedWidget],
            {
                selectWidgetWidth: "12em",
                templateString: template,
                mosaicMethodSelectValues: {
                    closestToCenter: "Closest To Center",
                    lockSelectedRasters: "Lock Selected Rasters",
                    byAttribute: "By Attribute",
                    mostNorthwest: "Most Northwest",
                    closestToNadir: "Closest To NADIR",
                    seamline: "SeamLine",
                    viewpoint: "Viewpoint",
                    none: "None"
                }
                //TODO: this is just a stub

            });

    });