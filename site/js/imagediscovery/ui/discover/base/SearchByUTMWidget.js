define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/text!./templates/SearchByUTMTemplate.html",
    "dojo/_base/lang",
    "./BaseSearchByWidget",
    "esriviewer/base/DataLoaderSupport",
    "dijit/form/NumberTextBox",
    "dijit/form/RadioButton",
    "dijit/form/Select",
    "esri/geometry/Point",
    "esri/SpatialReference"

],
    function (declare, topic, template, lang, BaseSearchByWidget, DataLoaderSupport, NumberTextBox, RadioButton, Select, Point, SpatialReference) {
        return declare(
            [BaseSearchByWidget, DataLoaderSupport],
            {
                utmLookupJsonUrl: "config/data/utm/UTMWKIDLookup.json",
                boundsUTMZoneSelectWidth: "3.5em",
                boundsUTMCoordInputWidth: "8em",

                templateString: template,
                /**
                 * called when an input value is changed
                 * @return {*}
                 */
                handleValueChange: function () {
                    return this.onValuesChanged(this.isValid());
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.loadJson(this.utmLookupJsonUrl, lang.hitch(this, this.handleUtmZoneLookupLoaded), lang.hitch(this, this.handleUtmZoneLookupLoadError));
                },
                /**
                 * called when the UTM lookup configuration file has been loaded
                 * @param response
                 */
                handleUtmZoneLookupLoaded: function (response) {
                    this.utmZoneLookup = response;
                    this._createUTMEntries();

                },
                /**
                 * called when there was an error loading UTM lookup configuration
                 */
                handleUtmZoneLookupLoadError: function () {
                    var msg = "Could not load UTM zone lookup";
                    VIEWER_UTILS.log(msg, VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, msg);
                },
                /**
                 * returns true when inputs are valid
                 * @return {*}
                 */
                isValid: function () {
                    try {
                        var x = parseFloat(this.boundsUTMEastingTextbox.get("value"));
                        var y = parseFloat(this.boundsUTMNorthingTextbox.get("value"));
                        return !isNaN(x) && !isNaN(y);
                    }
                    catch (err) {
                        return false;
                    }
                },
                /**
                 * returns the UTM geometry
                 * @return {*}
                 */
                getGeometry: function () {
                    try {
                        var x = parseFloat(this.boundsUTMEastingTextbox.get("value"));
                        var y = parseFloat(this.boundsUTMNorthingTextbox.get("value"));
                        var spatialReferenceWkidString = this.boundsUTMZoneSelect.get("value") + (this.boundsUTMHemisphereN.get("checked") ? "N" : "S");
                        //lookup the wkid
                        var wkid = this.utmZoneLookup[spatialReferenceWkidString];
                        if (wkid == null) {
                            return null;
                        }

                        return new Point(x, y, new SpatialReference(wkid));
                    }
                    catch (err) {
                        return null;
                    }

                },
                /**
                 * creates the UTM entries in the widget select
                 * @private
                 */
                _createUTMEntries: function () {
                    var zoneCount = 0;
                    for (var key in this.utmZoneLookup) {
                        zoneCount++;
                    }
                    //utmZoneLookup is N and S so we need to halve the count
                    zoneCount = zoneCount / 2;
                    for (var i = 0; i < zoneCount; i++) {
                        this.boundsUTMZoneSelect.addOption({label: "" + (i + 1), value: (i + 1)});
                    }
                }

            });

    });