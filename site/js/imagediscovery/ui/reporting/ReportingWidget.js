//TODO: this can be cleaned up a lot by using common methods that retrieve data over all report modes

define([
    "dojo/_base/declare",
    "dojo/date/locale",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/_base/json",
    "dojo/_base/Color",
    "dojo/text!./template/ReportingTemplate.html",
    "esriviewer/ui/base/UITemplatedWidget",
    "esriviewer/ui/draw/base/MapDrawSupport",
    "./model/ReportingViewModel",
    "dijit/form/Button",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol" ,
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/layers/ImageServiceParameters"
],
    function (declare, locale, topic, lang, json, Color, template, MapDrawSupport, UITemplatedWidget, ReportingViewModel, Button, SimpleFillSymbol, SimpleLineSymbol, QueryTask, Query, ImageServiceParameters) {
        return declare(
            [UITemplatedWidget, MapDrawSupport],
            {
                __defaultDisplayFormats: {
                    date: "MM/dd/yyyy"
                },
                displayFormats: {
                    date: "MM/dd/yyyy"
                },
                __defaultExportImageHeight: 800,
                __defaultExportImageWidth: 600,
                __defaultFloatPrecision: 1,
                templateString: template,
                envelopeSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([0, 128, 0]), 1),
                    new Color([255, 0, 0, .5])),
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    this.serviceQueryResponses = [];
                },
                postCreate: function () {
                    this.inherited(arguments);
                    if (this.resultFields) {
                        this.resultFieldsLabelLookup = {};
                        this.resultFieldsArray = [];
                        if (this.resultFields != null && lang.isArray(this.resultFields)) {
                            for (var i = 0; i < this.resultFields.length; i++) {
                                this.resultFieldsArray.push({field: this.resultFields[i].field, label: this.resultFields[i].label });
                                this.resultFieldsLabelLookup[this.resultFields[i].field] = this.resultFields[i].label;
                            }
                        }
                    }
                    this.viewModel = new ReportingViewModel();
                    this.viewModel.selectedExtractMode.subscribe(lang.hitch(this, this.handleExportTypeSelectChange));
                    this.viewModel.userDrawActive.subscribe(lang.hitch(this, this.handleUserDrawActiveChanged));
                    ko.applyBindings(this.viewModel, this.domNode);
                },
                loadViewerConfigurationData: function () {
                    var displayFieldsConfig;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageQueryResultDisplayFields", function (displayFieldsConf) {
                        displayFieldsConfig = displayFieldsConf;
                    });
                    if (displayFieldsConfig != null && lang.isObject(displayFieldsConfig)) {
                        this.resultFields = displayFieldsConfig;
                    }

                    var resultsFormattingConfig = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "resultsFormatting", function (resultsFormattingConf) {
                        resultsFormattingConfig = resultsFormattingConf;
                    });
                    if (resultsFormattingConfig && lang.isObject(resultsFormattingConfig)) {
                        if (resultsFormattingConfig.displayFormats && lang.isObject(resultsFormattingConfig.displayFormats)) {
                            this.displayFormats = resultsFormattingConfig.displayFormats;
                        }
                        if (resultsFormattingConfig.floatPrecision != null) {
                            this.floatPrecision = parseInt(resultsFormattingConfig.floatPrecision, 10);
                        }
                    }
                    var reportingConfiguration = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "reporting", function (reportingConf) {
                        reportingConfiguration = reportingConf;
                    });
                    if (reportingConfiguration) {
                        this.reportingConfiguration = reportingConfiguration;
                    }


                    var exportConfiguration = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "exportConfiguration", function (exportConf) {
                        exportConfiguration = exportConf;
                    });

                    if (exportConfiguration != null && lang.isObject(exportConfiguration)) {
                        if (exportConfiguration.image && lang.isObject(exportConfiguration.image)) {
                            this.exportImageParameters = exportConfiguration.image;
                        }
                    }
                },
                initListeners: function () {
                    this.inherited(arguments);
                    this.on("annotationCreated", lang.hitch(this, this.handleAnnotationCreatedFromUser));
                },
                handleExportTypeSelectChange: function (value) {
                    if (value != this.viewModel.draw) {
                        this.clearDraw();
                    }
                },
                clearDraw: function () {
                    this.inherited(arguments);
                    if (this.currentDrawGraphic) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.REMOVE, this.currentDrawGraphic);
                    }
                    this.currentDrawGraphic = null;
                    //get zoom back for shift key
                    topic.publish(VIEWER_GLOBALS.EVENTS.DRAW.USER.DRAW_CANCEL);
                },
                handleUserDrawActiveChanged: function (active) {
                    if (active) {
                        this.handleDrawRectangle();
                    }
                    else {
                        if (this.currentDrawGraphic == null) {
                            this.clearDraw();
                        }
                    }
                },
                handleDrawRectangle: function () {
                    this.clearDraw();
                    this.setDraw(VIEWER_GLOBALS.EVENTS.MAP.TOOLS.DRAW_RECTANGLE);
                },
                handleAnnotationCreatedFromUser: function (annoObj) {
                    this.currentDrawGraphic = annoObj.graphic;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.ADD, this.currentDrawGraphic);
                    this.viewModel.userDrawActive(false);
                },
                handleGenerateReport: function () {
                    this._generateReport();
                },
                _generateReport: function () {
                    if (this.viewModel.selectedExtractMode() === this.viewModel.draw && this.currentDrawGraphic == null) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Clip extent required");
                        VIEWER_UTILS.log("Could not generate report. A Clip extent is required", VIEWER_GLOBALS.LOG_TYPE.WARNING);
                        return;
                    }
                    if (this.viewModel.selectedReportFormat() == this.viewModel.HTML) {
                        //server side report
                        this._generateHTMLReport();
                    }
                    else {
                        //  this._generateServerSideReport();
                    }


                    VIEWER_UTILS.log("Generating Report", VIEWER_GLOBALS.LOG_TYPE.INFO);
                },
                _getRequestedExtentGeometry: function () {
                    var extent;
                    if (this.viewModel.selectedExtractMode() === this.viewModel.viewerExtent) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.GET_EXTENT, function (ext) {
                            extent = ext;
                        });
                        if (extent == null) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not retrieve map extent");
                            VIEWER_UTILS.log("Could not retrieve map extent for export", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                            return null;
                        }
                    }
                    else if (this.viewModel.selectedExtractMode() === this.viewModel.draw && this.currentDrawGraphic) {
                        extent = this.currentDrawGraphic.geometry;
                    }
                    else {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Clip extent required");
                        VIEWER_UTILS.log("Could not generate report. A Clip extent is required", VIEWER_GLOBALS.LOG_TYPE.WARNING);
                        return null;
                    }
                    return extent;
                },
                queryForResultsByExtent: function (queryLayer, lockRasters, extent, returnGeometry) {
                    if (returnGeometry == null) {
                        returnGeometry = true;
                    }
                    var queryUrl = queryLayer.url;
                    var queryTask = new QueryTask(queryUrl);
                    var query = new Query();
                    //get the out fields
                    var currentField;
                    query.outFields = [];
                    for (var i = 0; i < this.resultFieldsArray.length; i++) {
                        currentField = this.resultFieldsArray[i].field;
                        if (this._layerHasField(queryLayer, currentField)) {
                            query.outFields.push(currentField);
                        }
                    }
                    query.geometry = extent;
                    query.objectIds = lockRasters;
                    query.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                    query.returnGeometry = returnGeometry;
                    return queryTask.execute(query);
                },
                _layerHasField: function (layer, field) {
                    if (layer == null || layer.fields == null) {
                        return false;
                    }
                    for (var i = 0; i < layer.fields.length; i++) {
                        if (layer.fields[i].name === field) {
                            return true;
                        }
                    }
                    return false;
                },
                _getCurrentBasemapUrl: function () {
                    var currentBaseMap;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.BASEMAP.GET_CURRENT_URL, function (curr) {
                        currentBaseMap = curr;
                    });
                    if (currentBaseMap == null) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not retrieve base current map");
                        VIEWER_UTILS.log("Could not generate report. Could not retrieve base current map.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return null;
                    }
                    return currentBaseMap;
                },
                _generateHTMLReport: function () {
                    if (this.reportingConfiguration == null || !lang.isObject(this.reportingConfiguration) ||
                        this.reportingConfiguration.html == null || !lang.isObject(this.reportingConfiguration.html) ||
                        this.reportingConfiguration.html.templateURL == null
                        ) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not generate HTML report. Configuration entry missing");
                        VIEWER_UTILS.log("Could not generate HTML report. reporting.html.templateURL Configuration entry missing.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return;
                    }

                    var extent = this._getRequestedExtentGeometry();
                    if (extent == null) {
                        return;
                    }

                    var queryLayerControllers;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (qLCtrls) {
                        queryLayerControllers = qLCtrls;
                    });
                    if (queryLayerControllers == null) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not retrieve layer controllers");
                        VIEWER_UTILS.log("Could not retrieve layer controllers", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return;
                    }
                    this.hasResponseFeatures = false;
                    this.pendingServiceQueries = queryLayerControllers.length;
                    this.serviceQueryResponses = [];
                    var currentQueryLayerController;
                    var currentQueryLayerControllerLayer;
                    var currentLockRasterIds;
                    var currentMosaicRule;
                    for (var i = 0; i < queryLayerControllers.length; i++) {
                        currentQueryLayerController = queryLayerControllers[i];
                        if (currentQueryLayerController == null) {
                            continue;
                        }
                        currentQueryLayerControllerLayer = currentQueryLayerController.layer;
                        currentMosaicRule = currentQueryLayerControllerLayer.mosaicRule ? currentQueryLayerControllerLayer.mosaicRule : null;
                        if (currentQueryLayerControllerLayer == null || currentMosaicRule == null ||
                            currentMosaicRule.lockRasterIds == null || currentMosaicRule.lockRasterIds.length == 0) {
                            --this.pendingServiceQueries;
                        }
                        else {
                            var queryTaskDeferred = this.queryForResultsByExtent(currentQueryLayerControllerLayer,
                                currentMosaicRule.lockRasterIds, extent, false);
                            queryTaskDeferred.then(lang.hitch(this, this._handleResultsByExtentResponse, currentQueryLayerController));
                        }
                    }
                },
                _handleResultsByExtentResponse: function (queryLayerController, queryResponse) {
                    var queryResponseJson = queryResponse.toJson();
                    if (queryResponseJson.features == null) {
                        if (--this.pendingServiceQueries < 1) {
                            if (!this.hasResponseFeatures) {
                                topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There are no features to generate report");
                                VIEWER_UTILS.log("There are no features to generate report", VIEWER_GLOBALS.LOG_TYPE.WARNING);
                            }
                            else {
                                this._displayHTMLReport();
                            }
                        }
                        return;
                    }
                    var fieldTypeLookup = {doubles: {}, dates: {}};
                    var currentFeature;
                    var currentAttributes;
                    var currentValue;
                    var convertFieldName;
                    var currentField;
                    var newFieldName;
                    var i;
                    //convert the header field names to the labels in the viewer
                    if (this.resultFieldsLabelLookup && lang.isObject(this.resultFieldsLabelLookup)) {
                        if (queryResponseJson.fields && lang.isArray(queryResponseJson.fields)) {
                            var currentFieldName;
                            for (i = 0; i < queryResponseJson.fields.length; i++) {
                                currentField = queryResponseJson.fields[i];
                                currentFieldName = currentField.name;
                                if (this.resultFieldsLabelLookup[currentFieldName]) {
                                    newFieldName = this.resultFieldsLabelLookup[currentFieldName];
                                    queryResponseJson.fields[i].name = newFieldName;
                                    if (queryResponseJson.fields[i].type == VIEWER_GLOBALS.ESRI_FIELD_TYPES.DATE) {
                                        fieldTypeLookup.dates[newFieldName] = newFieldName;
                                    }
                                    else if (queryResponseJson.fields[i].type == VIEWER_GLOBALS.ESRI_FIELD_TYPES.DOUBLE) {
                                        fieldTypeLookup.doubles[newFieldName] = newFieldName;
                                    }
                                }
                            }
                        }
                        //convert ALL results field names to the labels in the viewer
                        for (i = 0; i < queryResponseJson.features.length; i++) {
                            currentFeature = queryResponseJson.features[i];
                            if (currentFeature == null) {
                                continue;
                            }
                            currentAttributes = currentFeature.attributes;
                            if (currentAttributes == null || !lang.isObject(currentAttributes)) {
                                continue;
                            }
                            this.hasResponseFeatures = true;
                            for (var key in currentAttributes) {
                                if (this.resultFieldsLabelLookup[key]) {
                                    //get the current value
                                    currentValue = currentAttributes[key];
                                    //delete the old key
                                    delete  currentAttributes[key];
                                    //replace
                                    convertFieldName = this.resultFieldsLabelLookup[key];

                                    //check for value formatter
                                    if (fieldTypeLookup.dates[convertFieldName] != null) {
                                        // convert the date
                                        currentValue = this.getFormattedDate(currentValue)

                                    }
                                    else if (fieldTypeLookup.doubles[convertFieldName] != null) {
                                        if (this.floatPrecision != null) {
                                            currentValue = currentValue.toFixed(this.floatPrecision);
                                        }
                                        else {
                                            currentValue = currentValue.toFixed(this.__defaultFloatPrecision);
                                        }
                                    }
                                    currentAttributes[convertFieldName] = currentValue;
                                }
                            }
                        }
                    }
                    this.serviceQueryResponses.push({featureSet: queryResponseJson, queryLayerController: queryLayerController});
                    if (--this.pendingServiceQueries < 1) {
                        if (!this.hasResponseFeatures) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There are no features to generate report");
                            VIEWER_UTILS.log("There are no features to generate report", VIEWER_GLOBALS.LOG_TYPE.WARNING);
                        }
                        else {
                            this._displayHTMLReport();
                        }
                    }
                },
                _displayHTMLReport: function () {
                    //do some magic here
                    var tableParameters = this._generateTableParameters(this.serviceQueryResponses);
                    var mapParameters = this._generateMapParameters(this.serviceQueryResponses);
                    //open the html report window
                    window._reportingWidgetParameters = {
                        mapParameters: mapParameters,
                        tableParameters: tableParameters
                    };
                    var opener = window.open(this.reportingConfiguration.html.templateURL);

                },
                _generateTableParameters: function (serviceQueryResponses) {
                    var tableDataArray = [];
                    var currentServiceQueryResponse;
                    //{featureSet: queryResponseJson, layer: layer})
                    var displayFormats = {};
                    if (this.displayFormats && this.displayFormats.date) {
                        displayFormats.date = this.displayFormats.date;
                    }
                    if (this.floatPrecision != null) {
                        displayFormats.floatPrecision = this.floatPrecision;
                    }
                    for (var i = 0; i < serviceQueryResponses.length; i++) {
                        currentServiceQueryResponse = serviceQueryResponses[i];
                        var layer = currentServiceQueryResponse.queryLayerController.layer;
                        tableDataArray.push({
                            objectIdField: layer.objectIdField,
                            source: currentServiceQueryResponse.queryLayerController.label,
                            featureSet: currentServiceQueryResponse.featureSet
                        });
                    }

                    return{
                        displayFormats: displayFormats,
                        tableDataArray: tableDataArray,
                        displayFields: this.resultFields,
                        hasSourceField: true
                    }
                },
                _generateMapParameters: function (serviceQueryResponses) {
                    var extent = this._getRequestedExtentGeometry();
                    if (extent == null) {
                        return;
                    }
                    var currentBaseMap = this._getCurrentBasemapUrl();
                    if (currentBaseMap == null) {
                        return;
                    }
                    var displayData = [];
                    var currentServiceQueryResponse;
                    //{featureSet: queryResponseJson, layer: layer})
                    var currentLayerMosaicRule;
                    for (var i = 0; i < serviceQueryResponses.length; i++) {
                        currentServiceQueryResponse = serviceQueryResponses[i];
                        var layer = currentServiceQueryResponse.queryLayerController.layer;
                        if (layer == null) {
                            continue;
                        }
                        currentLayerMosaicRule = layer.mosaicRule;
                        if (currentLayerMosaicRule && currentLayerMosaicRule.lockRasterIds && currentLayerMosaicRule.lockRasterIds.length > 0) {
                            displayData.push({layerUrl: layer.url, objectIds: currentLayerMosaicRule.lockRasterIds.join(",")});
                        }
                    }
                    return{
                        basemap: currentBaseMap,
                        extent: extent,
                        displayData: displayData
                    }
                },
                getFormattedDate: function (value) {
                    try {
                        var date = new Date(value);
                        var formatter = this.displayFormats.date != null ? this.displayFormats.date : this.__defaultDisplayFormats.date;
                        return locale.format(date, {selector: "date", datePattern: formatter});
                    }
                    catch (err) {
                        return value;
                    }

                }
            });
    });