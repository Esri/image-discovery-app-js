define([
    "dojo/_base/declare",
    "dojo/text!./templates/SearchByNSEWTemplate.html",
    "dojo/_base/lang",
    "./BaseSearchByWidget",
    "dijit/form/TextBox",
    "esri/geometry/Point",
    "esri/geometry/Polygon",
    "esri/SpatialReference"

],
    function (declare, template, lang, BaseSearchByWidget,TextBox,Point,Polygon,SpatialReference) {
        return declare(
            [BaseSearchByWidget],
            {
                imputWKID:4326,
                checkInputRegExp:new RegExp(/^[-+]?[0-9]*\.?[0-9]+,[-+]?[0-9]*\.?[0-9]+$/),
                nsewTextBoxWidth:"6em",
                templateString:template,
                /**
                              * called when an input value is changed
                              * @return {*}
                              */
                handleValueChange:function () {
                    return this.onValuesChanged(this.isValid());
                },
                /**
                            * returns true when inputs are valid
                            * @return {*}
                            */
                isValid:function () {
                    return this._getValidPointValues() != null;
                },
                _getValidPointValues:function () {
                    //get value and clear all whitespace
                    var n = REG_EXP_UTILS.stripWhitespace(this.boundsNInput.get("value"));
                    var s = REG_EXP_UTILS.stripWhitespace(this.boundsSInput.get("value"));
                    var e = REG_EXP_UTILS.stripWhitespace(this.boundsEInput.get("value"));
                    var w = REG_EXP_UTILS.stripWhitespace(this.boundsWInput.get("value"));

                    if (!this.checkInputRegExp.test(n) || !this.checkInputRegExp.test(s) || !this.checkInputRegExp.test(e) || !this.checkInputRegExp.test(w)) {
                        return null;
                    }


                    var northArr = n.split(",");
                    var eastArr = e.split(",");
                    var southArr = s.split(",");
                    var westArr = w.split(",");
                    if (northArr.length != 2 || eastArr.length != 2 || southArr.length != 2 || westArr.length != 2) {
                        return null;
                    }
                    try {
                        var northX = parseFloat(lang.trim(northArr[0]));
                        var northY = parseFloat(lang.trim(northArr[1]));

                        var eastX = parseFloat(lang.trim(eastArr[0]));
                        var eastY = parseFloat(lang.trim(eastArr[1]));

                        var southX = parseFloat(lang.trim(southArr[0]));
                        var southY = parseFloat(lang.trim(southArr[1]));

                        var westX = parseFloat(lang.trim(westArr[0]));
                        var westY = parseFloat(lang.trim(westArr[1]));

                         //northY can't be less than southY, eastX can't be less than westX, north can't equal south, east cant equal west
                        if (northY < southY || eastX < westX || ((northY == southY) && (northX == southX)) || ((eastX == westX) && (eastY == westY))) {
                            return null;
                        }
                        return {north:{x:northX, y:northY}, east:{x:eastX, y:eastY}, south:{x:southX, y:southY}, west:{x:westX, y:westY}};
                    }
                    catch (err) {
                        return null;
                    }
                },
                getGeometry:function () {
                    var ptsObj = this._getValidPointValues();
                    if (ptsObj != null) {
                        var northPt = new Point(ptsObj.north.x, ptsObj.north.y, new SpatialReference({wkid:this.workingWKID}));
                        var southPt = new Point(ptsObj.south.x, ptsObj.south.y, new SpatialReference({wkid:this.workingWKID}));
                        var eastPt = new Point(ptsObj.east.x, ptsObj.east.y, new SpatialReference({wkid:this.workingWKID}));
                        var westPt = new Point(ptsObj.west.x, ptsObj.west.y, new SpatialReference({wkid:this.workingWKID}));

                        var polygonGeometry = new Polygon();
                        polygonGeometry.setSpatialReference(new SpatialReference(4326));
                        polygonGeometry.addRing([westPt, northPt, eastPt, southPt, westPt]);
                        return polygonGeometry;
                    }
                    return null;
                }

            });

    })
;