define([
    "dojo/_base/declare",
    "dojo/text!./templates/SearchByDecimalDegreesTemplate.html",
    "./BaseSearchByWidget",
    "dijit/form/NumberTextBox",
    "esri/geometry/Extent",
    "esri/SpatialReference"

],
    function (declare, template, BaseSearchByWidget,NumberTextBox,Extent,SpatialReference) {
        return declare(
            [ BaseSearchByWidget],
            {
                searchWkid: 4326,
                templateString:template,
                handleValueChange:function () {
                    return this.onValuesChanged(this.isValid());
                },
                isValid:function () {
                    return this.validateLatDDBounds() && this.validateLonDDBounds();
                },
                validateLatDDBounds:function () {
                    var minx = this.boundsLLXInput.get("value");
                    var maxx = this.boundsURXInput.get("value");
                    if (isNaN(minx) || isNaN(maxx)) {
                        return false;
                    }
                    return minx < maxx;
                },
                validateLonDDBounds:function () {
                    var miny = this.boundsLLYInput.get("value");
                    var maxy = this.boundsURYInput.get("value");
                    if (isNaN(miny) || isNaN(maxy)) {
                        return false;
                    }
                    return miny < maxy;
                },
                getGeometry:function () {
                    var minx = this.boundsLLXInput.get("value");
                    var miny = this.boundsLLYInput.get("value");
                    var maxx = this.boundsURXInput.get("value");
                    var maxy = this.boundsURYInput.get("value");
                    return new Extent(minx,miny,maxx,maxy,new SpatialReference({wkid:this.searchWkid}));
                }

            });

    });