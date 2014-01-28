define([
    "dojo/_base/declare",
    "dojo/text!./template/MensurationWidgetTemplate.html",
    //  "xstyle/css!./theme/MensurationWidgetTheme.css",
    "dojo/topic",
    "dojo/_base/lang",
    "esriviewer/ui/base/UITemplatedWidget",
    "esriviewer/base/DataLoaderSupport",
    "dojo/_base/Color",
    "dojo/_base/json",
    "./model/MensurationViewModel",
    "dijit/form/Button" ,
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/geometry/Polyline",
    "esri/geometry/Point",
    "esri/geometry/Polygon",
    "esri/geometry/Extent",
    "esri/graphic",
    "dojo/_base/array"
],
    //this widget is contained in the analysis window content
    //  function (declare, template, theme, topic, lang, UITemplatedWidget,DataLoaderSupport , Color, json, MensurationViewModel, Button, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Polyline, Point, Polygon, Extent, Graphic, array) {
    function (declare, template, topic, lang, UITemplatedWidget, DataLoaderSupport, Color, json, MensurationViewModel, Button, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Polyline, Point, Polygon, Extent, Graphic, array) {
        return declare(
            [UITemplatedWidget, DataLoaderSupport],
            {

                bindingsApplied: false,
                defaultMensurationErrorMessage: "Error performing mensuration",
                measureUrlAppend: "/measure",
                mosaicRuleParamName: "mosaicRule",
                geometryTypeParamName: "geometryType",
                linearUnitsParamName: "linearUnit",
                mensurationOperationParamName: "measureOperation",
                fromGeometryParamName: "fromGeometry",
                toGeometryParamName: "toGeometry",
                noMensurationCapabilitiesStrings: ["Basic","None", "None,Basic", ""],
                templateString: template,
                mensurationLineSymbol: new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 255]), 3),
                mensurationPointSymbol: new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 1,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color("blue"))),
                mensurationEnvelopeSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH,
                        new Color([0, 0, 255]), 1),
                    new Color([0, 0, 0, 0])),

                constructor: function () {
                    this.mensurationGeometryType = VIEWER_GLOBALS.ESRI_GEOMETRY_TYPES.POINT;
                    this.mensurationUnits = VIEWER_GLOBALS.ESRI_UNITS.METERS;
                },

                postCreate: function () {
                    this.inherited(arguments);
                    this.createMensurationLookupCapabilities();

                    this.viewModel = new MensurationViewModel();
                    this.viewModel.selectedMensurationOption.subscribe(lang.hitch(this, this.handleMensurationTypeChanged));

                    this.mensurationDrawCallback = lang.hitch(this, this.handleMensurationDrawComplete);
                    this.mensurationCompleteCallback = lang.hitch(this, this.handleMensurationComplete);
                    this.mensurationErrorCallback = lang.hitch(this, this.handleMensurationError);
                },
                applyBindings: function () {
                    if (!this.bindingsApplied) {
                        ko.applyBindings(this.viewModel, this.domNode);
                        this.bindingsApplied = true;
                    }
                },
                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP, lang.hitch(this, this.handleStopMensuration));
                },
                /**
                 * stops the active mensuration and clears graphics added to map from mensuration widget
                 */
                handleStopMensuration: function () {
                    this.clearLastGraphic();
                    this.cancelMensuration();
                },
                /**
                 * called when mensuration type has changed in view
                 */
                handleMensurationTypeChanged: function () {
                    this.initSubmitMensuration();
                },
                /**
                 * called when mensuration draw is complete
                 * @param geometry user drawn mensuration geometry
                 */
                handleMensurationDrawComplete: function (geometry) {
                    //create a graphic from the completed mensuration draw and add it to the map
                    this.toolChangeConnect.remove();
                    this.clearLastGraphic();
                    var symbol;
                    if (geometry instanceof Polyline) {
                        symbol = this.mensurationLineSymbol;
                    }
                    else if (geometry instanceof Point) {
                        symbol = this.mensurationPointSymbol;
                    }
                    else if (geometry instanceof Extent) {
                        symbol = this.mensurationEnvelopeSymbol;
                    }
                    if (symbol == null) {
                        //todo show error
                        return;
                    }
                    this.currentMensurationGraphic = new Graphic(geometry, symbol);

                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.ADD, this.currentMensurationGraphic);
                    this.initSubmitMensuration();
                    this.startUserGraphicDraw();
                },
                /**
                 * initilizes user draw in mensuration widget
                 */
                startUserGraphicDraw: function () {
                    var selectedMensurationOption = this.viewModel.selectedMensurationOption();
                    if (selectedMensurationOption == null) {
                        //todo alert error
                        return;
                    }
                    var drawType = this.getDrawEventTypeForMensurationOption(selectedMensurationOption);

                    if (drawType == null) {
                        //todo alert error
                        return;
                    }

                    topic.publish(drawType, this.mensurationDrawCallback);
                    this.toolChangeConnect = topic.subscribe(VIEWER_GLOBALS.EVENTS.MAP.ACTIONS.TOOL_CHANGED, lang.hitch(this, function () {
                        this.cancelMensuration()
                    }));
                },
                /**
                 * clears the last mensuration drawn graphic from the map
                 */
                clearLastGraphic: function () {
                    if (this.currentMensurationGraphic != null) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.REMOVE, this.currentMensurationGraphic);
                        this.currentMensurationGraphic = null;
                    }
                },
                /**
                 * cancels the active user mensuration draw
                 */
                cancelUserGraphicDraw: function () {
                    topic.publish(VIEWER_GLOBALS.EVENTS.DRAW.USER.DRAW_CANCEL);
                    this.clearLastGraphic();
                },
                /**
                 * starts mensuration
                 */
                startMensuration: function () {
                    this.stopMensurationButton.set("disabled", false);
                    this.startMensurationButton.set("disabled", true);
                    this.clearDisplayValues();
                    this.viewModel.mensurationTypeSelectEnabled(false);
                    this.startUserGraphicDraw();
                },
                /**
                 * cancels the active mensuration
                 */
                cancelMensuration: function () {
                    //stop all mensuration operations
                    var mensurationEnabled = this.startMensurationButton.get("disabled");
                    if (mensurationEnabled) {
                        this.startMensurationButton.set("disabled", false);
                        this.stopMensurationButton.set("disabled", true);
                        this.cancelUserGraphicDraw();
                        this.clearDisplayValues();
                        this.viewModel.showDistanceResults(false);
                        this.viewModel.showAreaAndPerimeterResults(false);
                        this.viewModel.mensurationTypeSelectEnabled(true);
                    }
                    if (this.toolChangeConnect) {
                        this.toolChangeConnect.remove();
                        this.toolChangeConnect = null;
                    }
                },
                /**
                 * initialize the request to perform mensuration server side
                 */
                initSubmitMensuration: function () {
                    if (this.currentMensurationGraphic == null || this.layer == null) {
                        return;
                    }
                    var startPoint = null;
                    var endPoint = null;
                    var mensurationGeometry = this.currentMensurationGraphic.geometry;
                    var mensurationType = this.viewModel.selectedMensurationOption();
                    var mensurationParameters = {mensurationType: mensurationType};
                    if (mensurationGeometry instanceof Polyline) {
                        //todo currently all line geometries are converted to a start and end point. this may change
                        if (mensurationGeometry.paths && lang.isArray(mensurationGeometry.paths) && mensurationGeometry.paths[0] && mensurationGeometry.paths[0].length > 1) {
                            startPoint = new Point(mensurationGeometry.paths[0][0][0], mensurationGeometry.paths[0][0][1], mensurationGeometry.spatialReference);
                            endPoint = new Point(mensurationGeometry.paths[0][1][0], mensurationGeometry.paths[0][1][1], mensurationGeometry.spatialReference);
                        }

                        if (startPoint == null || endPoint == null) {
                            //todo error out here with a message
                            return;
                        }
                        mensurationParameters[this.fromGeometryParamName] = startPoint;
                        mensurationParameters[this.toGeometryParamName] = endPoint;
                    }
                    else {
                        //everything else is just a from geometry
                        mensurationParameters[this.fromGeometryParamName] = mensurationGeometry;
                    }

                    this._performMensuration(mensurationParameters);
                },
                /**
                 * send the mensuration request to the layer service
                 * @param mensurationParams
                 * @private
                 */

                _performMensuration: function (mensurationParams) {
                    if (mensurationParams == null || mensurationParams.mensurationType == null) {
                        //todo alert of the error
                        return;
                    }
                    var mosaicRule = this.layer.mosaicRule;
                    if (mosaicRule != null && mosaicRule.lockRasterIds.length == 0) {
                        mosaicRule = null;
                    }
                    var requestParams = {f: "json"};
                    var fromGeometry = mensurationParams[this.fromGeometryParamName];
                    requestParams[this.fromGeometryParamName] = json.toJson(fromGeometry);
                    requestParams[this.toGeometryParamName] = json.toJson(mensurationParams[this.toGeometryParamName]);
                    requestParams[this.mensurationOperationParamName] = mensurationParams.mensurationType;
                    requestParams[this.linearUnitsParamName] = this.mensurationUnits;

                    //get the type of from geometry
                    var geometryType;
                    if (fromGeometry instanceof Polyline) {
                        geometryType = VIEWER_GLOBALS.ESRI_GEOMETRY_TYPES.LINE;
                    }
                    else if (fromGeometry instanceof Point) {
                        geometryType = VIEWER_GLOBALS.ESRI_GEOMETRY_TYPES.POINT;
                    }
                    else if (fromGeometry instanceof Extent) {
                        geometryType = VIEWER_GLOBALS.ESRI_GEOMETRY_TYPES.ENVELOPE;
                    }
                    else if (fromGeometry instanceof Polygon) {
                        geometryType = VIEWER_GLOBALS.ESRI_GEOMETRY_TYPES.POLYGON;
                    }
                    if (geometryType == null) {
                        //todo error out here with a message
                        return;
                    }
                    requestParams[this.geometryTypeParamName] = geometryType;
                    if (mosaicRule != null) {
                        requestParams[this.mosaicRuleParamName] = json.toJson(mosaicRule);
                    }
                    var measureLayerUrl = this.layer.url + this.measureUrlAppend;
                    this.loadJsonP(measureLayerUrl, requestParams, this.mensurationCompleteCallback, this.mensurationErrorCallback)
                },
                /**
                 * returns true if the passes layer supports mensuration
                 * @param layer layer to check for mensuration support
                 * @return {boolean}
                 */
                layerSupportsMensuration: function (layer) {
                    var menCapExcludeIdx = array.indexOf(this.noMensurationCapabilitiesStrings, layer.mensurationCapabilities);
                    return !(layer == null || layer.mensurationCapabilities == null || menCapExcludeIdx > -1);
                },
                /**
                 * sets the current query layer controller for mensuration
                 * @param queryLayerController
                 */
                setQueryLayerController: function (queryLayerController) {
                    this.queryLayerController = queryLayerController;
                    if (this.queryLayerController == null || this.queryLayerController.layer == null) {
                        return;
                    }
                    this.layer = this.queryLayerController.layer;
                    //kill all the mensuration options
                    this.viewModel.mensurationOptions.removeAll();
                    if (this.layer == null || array.indexOf(this.noMensurationCapabilitiesStrings, this.layer.mensurationCapabilities) > -1) {
                        this.viewModel.setMensurationNotSupported();
                    }
                    else {
                        this.viewModel.setMensurationSupported();
                        this.setMensurationCapabilities(this.layer.mensurationCapabilities.split(","));
                    }
                    if (!this.bindingsApplied) {
                        this.applyBindings();
                    }
                },
                /**
                 * sets the mensuration capabilities in the mensuration view
                 * @param mensurationCapabilities
                 */
                setMensurationCapabilities: function (mensurationCapabilities) {
                    this.viewModel.mensurationOptions.removeAll();
                    var currentMensurationCapability;
                    var currentMensurationCapArray;
                    var i, j;
                    for (i = 0; i < mensurationCapabilities.length; i++) {
                        currentMensurationCapability = mensurationCapabilities[i];
                        currentMensurationCapArray = this.mensurationCapabilitiesLookup[currentMensurationCapability];
                        if (currentMensurationCapArray == null) {
                            continue;
                        }
                        for (j = 0; j < currentMensurationCapArray.length; j++) {
                            this.viewModel.mensurationOptions.push(currentMensurationCapArray[j]);
                        }
                    }

                },
                /**
                 * processes a mensuration response from the active layer service
                 * @param mensurationResponse
                 */
                handleMensurationComplete: function (mensurationResponse) {
                    //figure out which type of mensuration was performed and populate the view model with the results
                    if (mensurationResponse) {
                        if (mensurationResponse.error) {
                            this.handleMensurationError(mensurationResponse.error);
                        }
                        if (mensurationResponse.height || mensurationResponse.distance) {
                            this.viewModel.showDistanceResults(true);
                            this.viewModel.showAreaAndPerimeterResults(false);
                        }

                        if (mensurationResponse.height) {
                            this.viewModel.distanceOrHeightLabel("Height:");
                            if (mensurationResponse.height.value < 0) {
                                this.viewModel.distanceOrHeightValue("Invalid Measurement");
                                this.viewModel.uncertaintyValue("");
                            }
                            else {
                                var heightUnitLbl = VIEWER_UTILS.getShortLabelForEsriUnit(mensurationResponse.height.unit);
                                this.viewModel.distanceOrHeightValue(REG_EXP_UTILS.numberToStringWithCommas(mensurationResponse.height.value.toFixed(3)) + " " + heightUnitLbl);
                                this.viewModel.uncertaintyValue(REG_EXP_UTILS.numberToStringWithCommas(mensurationResponse.height.uncertainty.toFixed(2)) + " " + heightUnitLbl);
                            }
                        }
                        else if (mensurationResponse.distance) {
                            this.viewModel.distanceOrHeightLabel("Distance:");
                            if (mensurationResponse.height.value < 0) {
                                this.viewModel.distanceOrHeightValue("Invalid Measurement");
                                this.viewModel.uncertaintyValue("");
                            }
                            else {
                                var distanceUnitLbl = VIEWER_UTILS.getShortLabelForEsriUnit(mensurationResponse.distance.unit);
                                this.viewModel.distanceOrHeightValue(REG_EXP_UTILS.numberToStringWithCommas(mensurationResponse.distance.value.toFixed(3)) + " " + distanceUnitLbl);
                                this.viewModel.uncertaintyValue(REG_EXP_UTILS.numberToStringWithCommas(mensurationResponse.distance.uncertainty.toFixed(2)) + " " + distanceUnitLbl);
                            }
                        }
                        else if (mensurationResponse.area && mensurationResponse.perimeter) {
                            var areaUnitLbl = VIEWER_UTILS.getShortLabelForEsriUnit(mensurationResponse.area.unit);
                            var perimeterUnitLbl = VIEWER_UTILS.getShortLabelForEsriUnit(mensurationResponse.perimeter.unit);
                            this.viewModel.areaValue(REG_EXP_UTILS.numberToStringWithCommas(mensurationResponse.area.value.toFixed(3)) + " " + areaUnitLbl);
                            this.viewModel.perimeterValue(REG_EXP_UTILS.numberToStringWithCommas(mensurationResponse.perimeter.value.toFixed(3)) + " " + perimeterUnitLbl);
                            this.viewModel.showAreaAndPerimeterResults(true);
                            this.viewModel.showDistanceResults(false);

                        }
                        if (mensurationResponse.azimuthAngle) {
                            this.viewModel.showAzimuth(true);
                            var azimuthUnitLabel = VIEWER_UTILS.getShortLabelForEsriUnit(mensurationResponse.azimuthAngle.unit);
                            this.viewModel.azimuthValue(REG_EXP_UTILS.numberToStringWithCommas(mensurationResponse.azimuthAngle.value.toFixed(3)) + " " + azimuthUnitLabel)

                        }
                        else {
                            this.viewModel.showAzimuth(false);

                        }

                    }
                    else {
                        this.handleMensurationError(null);
                    }
                },
                /**
                 * handles server side mensuration response error
                 * @param error
                 */
                handleMensurationError: function (error) {
                    this.clearDisplayValues();
                    if (error) {
                        if (lang.isString(error)) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, error);
                            VIEWER_UTILS.log(error, VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        }
                        else if (lang.isObject(error) && error.details != null && lang.isArray(error.details) && error.details.length > 0) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, error.details[0]);
                            VIEWER_UTILS.log(error.details[0], VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        }
                    }
                    else {

                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, this.defaultMensurationErrorMessage);
                        VIEWER_UTILS.log(this.defaultMensurationErrorMessage, VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    }
                },
                getDrawEventTypeForMensurationOption: function (mensurationType) {
                    if (this.mensurationDrawGeometryLookupType == null) {
                        this.createMensurationDrawGeometryLookup();
                    }
                    return this.mensurationDrawGeometryLookupType[mensurationType];
                },
                createMensurationDrawGeometryLookup: function () {
                    if (this.mensurationDrawGeometryLookupType == null) {
                        this.mensurationDrawGeometryLookupType = {
                            "esriMensurationPoint": VIEWER_GLOBALS.EVENTS.DRAW.USER.POINT_INPUT,
                            "esriMensurationDistanceAndAngle": VIEWER_GLOBALS.EVENTS.DRAW.USER.LINE_INPUT,
                            "esriMensurationHeightFromBaseAndTop": VIEWER_GLOBALS.EVENTS.DRAW.USER.LINE_INPUT,
                            "esriMensurationHeightFromTopAndTopShadow": VIEWER_GLOBALS.EVENTS.DRAW.USER.LINE_INPUT,
                            "esriMensurationHeightFromBaseAndTopShadow": VIEWER_GLOBALS.EVENTS.DRAW.USER.LINE_INPUT,
                            "esriMensurationAreaAndPerimeter": VIEWER_GLOBALS.EVENTS.DRAW.USER.RECTANGLE_INPUT,
                            "esriMensurationCentroid": VIEWER_GLOBALS.EVENTS.DRAW.USER.RECTANGLE_INPUT
                        }
                    }
                },
                createMensurationLookupCapabilities: function () {
                    if (this.mensurationCapabilitiesLookup == null) {
                        this.mensurationCapabilitiesLookup = {
                            "Basic": [
                                //    {label: "Point", value: "esriMensurationPoint"},
                                //   {label: "Centroid", value: "esriMensurationCentroid"},

                                //    {label: "Distance And Angle", value: "esriMensurationDistanceAndAngle"},
                                //     {label: "Area And Perimeter", value: "esriMensurationAreaAndPerimeter"}
                            ],
                            "Base-Top Height": [
                                {label: "Base-Top Height", value: "esriMensurationHeightFromBaseAndTop"}
                            ],
                            "Top-Top Shadow Height": [
                                {label: "Top-Top Shadow", value: "esriMensurationHeightFromTopAndTopShadow"}
                            ],
                            "Base-Top Shadow Height": [
                                {label: "Base-Top Shadow", value: "esriMensurationHeightFromBaseAndTopShadow"}
                            ]
                            //ignoring 3D
                        }
                    }
                },
                clearDisplayValues: function () {
                    //clears everything in the view model for mensuration
                    this.viewModel.distanceOrHeightValue("");
                    this.viewModel.azimuthValue("");
                    this.viewModel.uncertaintyValue("");
                    this.viewModel.areaValue("");
                    this.viewModel.perimeterValue("");
                    this.viewModel.distanceOrHeightLabel("");
                    this.viewModel.showAzimuth(false);
                    this.viewModel.showAreaAndPerimeterResults(false);
                    this.viewModel.showDistanceResults(false);
                }
            });
    })
;