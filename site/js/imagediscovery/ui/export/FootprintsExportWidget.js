define([
    "dojo/_base/declare",
    "dojo/text!./template/FootprintsExportTemplate.html",
    "dojo/topic",
    "dojo/date/locale",
    "dojo/_base/lang",
    "dojo/_base/json",
    "dojo/_base/Color",
    "esriviewer/ui/base/UITemplatedWidget",
    "esriviewer/ui/draw/base/MapDrawSupport",
    "./model/FootprintsDownloadViewModel",
    "dijit/form/Button",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/tasks/Geoprocessor"
],
    function (declare, template, topic, locale, lang, json, Color, UITemplatedWidget, MapDrawSupport, FootprintsDownloadViewModel, Button, SimpleFillSymbol, SimpleLineSymbol, QueryTask, Query, Geoprocessor) {
        return declare(
            [UITemplatedWidget, MapDrawSupport],
            {
                __defaultDisplayFormats: {
                    date: "MM/dd/yyyy"
                },
                displayFormats: {
                    date: "MM/dd/yyyy"
                },
                hasResponseFeatures: false,
                pendingServiceQueries: 0,
                templateString: template,
                _hasExportTask: false,
                envelopeSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([0, 128, 0]), 1),
                    new Color([255, 0, 0, .5])),
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    this.serviceQueryResponseFeatures = [];
                },
                postCreate: function () {
                    this.inherited(arguments);
                    if (this.resultFields) {
                        this.resultFieldsLabelLookup = {};
                        this.resultFieldsArray = [];
                        if (this.resultFields != null && lang.isArray(this.resultFields)) {
                            for (var i = 0; i < this.resultFields.length; i++) {
                                this.resultFieldsArray.push({field: this.resultFields[i].field, label: this.resultFields[i].label });
                                this.resultFieldsLabelLookup[this.resultFields[i].field] = this.sanitizeFieldName(this.resultFields[i].label);
                            }
                        }
                    }
                    if (this.footprintsExportTaskConfiguration == null || !lang.isObject(this.footprintsExportTaskConfiguration) ||
                        this.footprintsExportTaskConfiguration.url == null ||
                        this.footprintsExportTaskConfiguration.featureInputParameter == null ||
                        this.footprintsExportTaskConfiguration.outputUrlParameter == null) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Footprints export task is not configured.");
                        VIEWER_UTILS.log("Footprints export task is not configured.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        this._hasExportTask = false;
                    }
                    else {
                        this._hasExportTask = true;
                        this.handleExportTaskResponseCallback = lang.hitch(this, this.handleExportTaskResponse);
                        this.handleExportTaskErrorCallback = lang.hitch(this, this.handleExportTaskError);
                        this.handleProcessDownloadUrlCallback = lang.hitch(this, this.handleProcessDownloadUrl);
                    }
                    this.viewModel = new FootprintsDownloadViewModel();
                    this.viewModel.selectedExtractMode.subscribe(lang.hitch(this, this.handleExportTypeSelectChange));
                    this.viewModel.userDrawActive.subscribe(lang.hitch(this, this.handleUserDrawActiveChanged));
                    ko.applyBindings(this.viewModel, this.domNode);
                },
                loadViewerConfigurationData: function () {
                    var displayFieldsConfig;
                    //get the display fields so we know what fields to export
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageQueryResultDisplayFields", function (displayFieldsConf) {
                        displayFieldsConfig = displayFieldsConf;
                    });
                    if (displayFieldsConfig != null && lang.isObject(displayFieldsConfig)) {
                        this.resultFields = displayFieldsConfig;
                    }

                    //get the formatters so the gp tool can format accordingly
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
                    //get the export map configuration entries
                    var exportConfiguration = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "exportConfiguration", function (exportConf) {
                        exportConfiguration = exportConf;
                    });
                    if (exportConfiguration && lang.isObject(exportConfiguration)) {
                        if (exportConfiguration.footprints) {
                            if (exportConfiguration.footprints.task) {
                                this.footprintsExportTaskConfiguration = exportConfiguration.footprints.task;
                            }

                        }
                    }
                },
                initListeners: function () {
                    this.inherited(arguments);
                    this.on("annotationCreated", lang.hitch(this, this.handleAnnotationCreatedFromUser));
                },
                /**
                 * adds graphic to the map from the user footprints export bounds draw
                 * @param annoObj
                 */
                handleAnnotationCreatedFromUser: function (annoObj) {
                    this.currentDrawGraphic = annoObj.graphic;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.ADD, this.currentDrawGraphic);
                    this.viewModel.userDrawActive(false);
                },
                /**
                 * clears the users drawn footprints export graphic
                 */
                clearDraw: function () {
                    this.inherited(arguments);
                    if (this.currentDrawGraphic) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GRAPHICS.REMOVE, this.currentDrawGraphic);
                    }
                    this.currentDrawGraphic = null;
                    //get zoom back for shift key
                    topic.publish(VIEWER_GLOBALS.EVENTS.DRAW.USER.DRAW_CANCEL);
                },
                handleExportTypeSelectChange: function (value) {
                    if (value != this.viewModel.draw) {
                        this.clearDraw();
                    }
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
                /**
                 * called when the user requests a footprint export
                 */
                handleFootprintsExportClick: function () {
                    if (!this._hasExportTask) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Cannot export. Footprints export task need to be present in configuration.");
                        VIEWER_UTILS.log("Cannot export. Footprints export task need to be present in configuration.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return;
                    }
                    var downloadLayerControllerObjectIdsArray = this.getDownloadObjectIds();
                    if (downloadLayerControllerObjectIdsArray == null || !lang.isArray(downloadLayerControllerObjectIdsArray) || downloadLayerControllerObjectIdsArray.length == 0) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There is no selected imagery");
                        VIEWER_UTILS.log("Could not download footprints. There is not selected imagery", VIEWER_GLOBALS.LOG_TYPE.WARNING);
                        return;
                    }
                    //get the map extent
                    var extent;
                    if (this.viewModel.selectedExtractMode() === this.viewModel.viewerExtent) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.GET_EXTENT, function (ext) {
                            extent = ext;
                        });
                        if (extent == null) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not retrieve map extent");
                            VIEWER_UTILS.log("Could not retrieve map extent for export", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                            return;
                        }
                    }
                    else if (this.viewModel.selectedExtractMode() === this.viewModel.draw) {
                        if (this.currentDrawGraphic == null) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Clip extent required");
                            VIEWER_UTILS.log("Could not generate report. A Clip extent is required", VIEWER_GLOBALS.LOG_TYPE.WARNING);
                            return;
                        }
                        else {
                            extent = this.currentDrawGraphic.geometry;
                        }
                    }
                    else if (this.viewModel.selectedExtractMode() === this.viewModel.worldExtent) {
                        extent = null;
                    }
                    else {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Unknown Footprint Extract Mode");
                        VIEWER_UTILS.log("Unknown Footprint Extract Mode", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return;
                    }
                    this.hasResponseFeatures = false;
                    this.pendingServiceQueries = downloadLayerControllerObjectIdsArray.length;
                    this.serviceQueryResponseFeatures = [];
                    var currentQueryLayerController;
                    var currentQueryLayer;
                    //loop through the query layer controller and performa query on them to get the items we want to extract
                    for (var i = 0; i < downloadLayerControllerObjectIdsArray.length; i++) {
                        currentQueryLayerController = downloadLayerControllerObjectIdsArray[i].queryController;
                        currentQueryLayer = currentQueryLayerController.layer;
                        var queryTask = new QueryTask(currentQueryLayer.url);
                        var query = new Query();
                        query.objectIds = downloadLayerControllerObjectIdsArray[i].objectIds;
                        if (extent != null) {
                            query.geometry = extent;
                            query.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                        }
                        query.returnGeometry = true;
                        //get the out fields
                        query.outFields = [];
                        var visibleCartFieldNames;
                        topic.publish(IMAGERY_GLOBALS.EVENTS.CART.GET_VISIBLE_FIELD_NAMES, function (viCtFdNms) {
                            visibleCartFieldNames = viCtFdNms;
                        });
                        if (visibleCartFieldNames.length == 0) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There are no columns in the result grid");
                            VIEWER_UTILS.log("Could not export footprints. There are no columns in the result grid.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                            return;
                        }
                        for (var j = 0; j < visibleCartFieldNames.length; j++) {
                            var fieldExistsAndTrueFieldName = IMAGERY_UTILS.getFieldExistsAndServiceFieldName(visibleCartFieldNames[j], currentQueryLayerController);
                            if (fieldExistsAndTrueFieldName.exists) {
                                query.outFields.push(fieldExistsAndTrueFieldName.fieldName);
                            }
                        }
                        var queryTaskDeferred = queryTask.execute(query);
                        queryTaskDeferred.then(lang.hitch(this, this._handleExportQueryResponse, currentQueryLayerController));
                    }

                },
                /**
                 * converts a query response to a format for the discovery viewers footprint export geoprocessor
                 * @param queryLayerController
                 * @param queryResponse
                 * @private
                 */
                _handleExportQueryResponse: function (queryLayerController, queryResponse) {
                    var currentLayer = queryLayerController.layer;
                    var queryResponseJson = queryResponse.toJson();
                    var i;
                    var fieldMapping = (queryLayerController.serviceConfiguration && queryLayerController.serviceConfiguration.fieldMapping) ? queryLayerController.serviceConfiguration.fieldMapping : {};
                    var fieldTypeLookup = {domains: {}};
                    //convert the field names to the labels in the viewer
                    if (this.resultFieldsLabelLookup && lang.isObject(this.resultFieldsLabelLookup)) {
                        if (queryResponseJson.fields && lang.isArray(queryResponseJson.fields)) {
                            var currentFieldName;
                            var currentFieldType;
                            var currentField;
                            for (i = 0; i < queryResponseJson.fields.length; i++) {
                                currentField = queryResponseJson.fields[i];
                                currentFieldName = currentField.name;
                                currentFieldType = currentField.type;
                                if (currentFieldName == currentLayer.objectIdField) {
                                    continue;
                                }
                                //attempt mapping
                                currentFieldName = fieldMapping[currentFieldName] != null ? fieldMapping[currentFieldName] : currentFieldName;
                                if (this.resultFieldsLabelLookup[currentFieldName]) {
                                    currentField.name = this.resultFieldsLabelLookup[currentFieldName];
                                    currentField.alias = this.resultFieldsLabelLookup[currentFieldName];
                                }
                                if (currentField.domain != null && lang.isObject(currentField.domain)) {
                                    fieldTypeLookup.domains[currentField.name] = IMAGERY_UTILS.codedValuesDomainToHash(currentField.domain.codedValues);
                                    //clear the domain since we are handling domain conversion client side
                                    currentField.domain = null;
                                    //set the field type to string since we are setting the values as a string on the attributes
                                    currentField.type = VIEWER_GLOBALS.ESRI_FIELD_TYPES.STRING;
                                }
                            }
                        }

                        //convert ALL results field names to the labels in the viewer
                        var currentFeature;
                        var currentAttributes;
                        var currentValue;
                        var currentAttributeFieldName;
                        var convertFieldName;
                        if (queryResponseJson.features != null) {
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
                                var attributeKeysArray = [];
                                for (var key in currentAttributes) {
                                    //don't mess with object id field
                                    if (key ===  currentLayer.objectIdField) {
                                        continue;
                                    }
                                    attributeKeysArray.push(key);
                                }
                                var currKey;

                                for (var j = 0; j < attributeKeysArray.length; j++) {
                                    currKey = attributeKeysArray[j];
                                    currentAttributeFieldName = fieldMapping[currKey] != null ? fieldMapping[currKey] : currKey;
                                    if (this.resultFieldsLabelLookup[currentAttributeFieldName]) {
                                        //get the current value
                                        currentValue = currentAttributes[currKey];
                                        //delete the old key
                                        delete  currentAttributes[currKey];
                                        //replace
                                        convertFieldName = this.resultFieldsLabelLookup[currentAttributeFieldName];
                                        //check for value formatter
                                        if (fieldTypeLookup.domains[convertFieldName] != null) {
                                            currentValue = fieldTypeLookup.domains[convertFieldName][currentValue];
                                            currentValue.toString();
                                        }
                                        currentAttributes[convertFieldName] = currentValue;
                                    }
                                }
                            }
                            this.serviceQueryResponseFeatures.push({response: queryResponseJson, layer: queryLayerController.layer});
                        }
                    }
                    if (--this.pendingServiceQueries < 1) {
                        if (!this.hasResponseFeatures) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There are no footprints to download");
                            VIEWER_UTILS.log("There are no footprints to download", VIEWER_GLOBALS.LOG_TYPE.WARNING);
                        }
                        else {
                            this._exportFootprints();
                        }
                    }
                    else {
                    }
                },
                _exportFootprints: function () {
                    var displayFormats = {
                        date: this.__defaultDateFormat,
                        floatPrecision: 6

                    };
                    if (this.displayFormats && this.displayFormats.date) {
                        displayFormats.date = this.displayFormats.date
                    }
                    var footprintInfoObject = {
                        format: this.viewModel.selectedDownloadFormat(),
                        featureSet: this.mergeResults(this.serviceQueryResponseFeatures),
                        displayFormats: displayFormats

                    };
                    var gpParams = {};
                    gpParams[this.footprintsExportTaskConfiguration.featureInputParameter] = json.toJson(footprintInfoObject);
                    if (this.footprintsExportTask == null) {
                        this.footprintsExportTask = new Geoprocessor(this.footprintsExportTaskConfiguration.url);
                    }
                    if (this.footprintsExportTaskConfiguration.isAsync == null || this.footprintsExportTaskConfiguration.isAsync) {
                        this.footprintsExportTask.submitJob(gpParams, this.handleExportTaskResponseCallback, null,
                            this.handleExportTaskErrorCallback);
                    }
                    else {
                        this.footprintsExportTask.execute(gpParams, this.handleExportTaskResponseCallback,
                            this.handleExportTaskErrorCallback);
                    }

                    this.clearDraw();
                    VIEWER_UTILS.log("Downloading Selected Data", VIEWER_GLOBALS.LOG_TYPE.INFO);
                },
                /**
                 * handles the response from the discovery viewers footprint geoprocessor
                 * @param response
                 */
                handleExportTaskResponse: function (response) {
                    if (response == null || !lang.isObject(response) || response.results == null) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not process footprints export response. Please contact an administrator.");
                        VIEWER_UTILS.log("Could not processed footprints export response. Please contact an administrator for help.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return;
                    }
                    if (response.results[this.footprintsExportTaskConfiguration.outputUrlParameter] != null) {
                        //get the output URL
                        this.footprintsExportTask.getResultData(response.jobId, this.footprintsExportTaskConfiguration.outputUrlParameter, this.handleProcessDownloadUrlCallback);
                    }
                    else {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Synchronous GP not implemented for footprints export.");
                        VIEWER_UTILS.log("Synchronous GP not implemented for footprints export.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    }
                },
                /**
                 * handles error from the discovery viewers footprint geoprocessor
                 * @param error
                 * @return {null}
                 */
                handleExportTaskError: function (error) {
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There was an error requesting footprints export");
                    VIEWER_UTILS.log("There was an error requesting footprints export", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    return null;
                },
                /**
                 * opens the footprint download url in a new browser window
                 * @param urlResponse
                 */
                handleProcessDownloadUrl: function (urlResponse) {
                    if (urlResponse == null || !lang.isObject(urlResponse) || urlResponse.value == null || !lang.isObject(urlResponse.value) || urlResponse.value.url == null) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There was an error requesting footprints download URL");
                        VIEWER_UTILS.log("There was an error requesting footprints download URL", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    }
                    else {
                        window.location = urlResponse.value.url;
                    }
                },
                sanitizeFieldName: function (fieldName) {
                    return (fieldName.replace(/\W/g, '')).replace(/[0-9_]/, '');
                },
                /**
                 * merges query results from catalog responses
                 * @param results array of query results to merge
                 * @return {*}
                 */
                mergeResults: function (results) {
                    //merges all of the query results into a single result
                    if (results.length == 1) {
                        return results[0].response;
                    }
                    var i, j;
                    var mergedFeatures = [];
                    var mergedFields = [];
                    var usedFieldNames = {};
                    var currentResponse;
                    var currentFeatures;
                    var currentFeature;
                    var currentLayer;
                    var currentFields;
                    var currentField;
                    var currentFeatureCount = 0;
                    for (i = 0; i < results.length; i++) {
                        currentLayer = results[i].layer;
                        currentResponse = results[i].response;
                        currentFeatures = currentResponse.features;
                        //merge features
                        if (currentFeatures != null) {
                            for (j = 0; j < currentFeatures.length; j++) {
                                currentFeature = currentFeatures[j];
                                currentFeature[currentLayer.objectIdField] = currentFeatureCount++;
                                mergedFeatures.push(currentFeature);
                            }
                        }
                        currentFields = currentResponse.fields;
                        for (j = 0; j < currentFields.length; j++) {
                            currentField = currentFields[j];
                            if (usedFieldNames[currentField.name] == null) {
                                mergedFields.push(currentField);
                                usedFieldNames[currentField.name] = currentField;
                            }
                        }
                    }
                    return {features: mergedFeatures, fields: mergedFields};
                },
                //MUST BE EXTENDED to return array like: [queryController: CLASS, objectIds: [1,2,3]]
                getDownloadObjectIds: function () {
                    alert("must extend getDownloadObjectIds to get query layer controllers and object ids ")
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
    })
;