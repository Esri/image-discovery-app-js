//TODO: this can be cleaned up a lot by using common methods that retrieve data over all report modes

define([
    "dojo/_base/declare",
    "dojo/date/locale",
    "dojo/topic",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/_base/Color",
    //  "xstyle/css!./theme/ReportingTheme.css",
    "dojo/text!./template/ReportingTemplate.html",
    "esriviewer/ui/base/UITemplatedWidget",
    "esriviewer/ui/draw/base/MapDrawSupport",
    "./model/ReportingViewModel",
    "dijit/form/Button",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol" ,
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/tasks/PrintTemplate",
    "esri/tasks/PrintParameters",
    "esri/tasks/PrintTask"
],
    //   function (declare, locale, topic, array, lang,  Color, theme, template, MapDrawSupport, UITemplatedWidget, ReportingViewModel, Button, SimpleFillSymbol, SimpleLineSymbol, QueryTask, Query) {
    function (declare, locale, topic, array, lang, Color, template, UITemplatedWidget, MapDrawSupport, ReportingViewModel, Button, SimpleFillSymbol, SimpleLineSymbol, QueryTask, Query, PrintTemplate, PrintParameters, PrintTask) {
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

                    if (this.reportingConfiguration && this.reportingConfiguration.pdf && this.reportingConfiguration.pdf.exportWebMapTaskURL) {
                        this.viewModel.reportFormat.push({label: this.viewModel.PDF, value: this.viewModel.PDF});
                    }

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
                    //get formatting configuration so we can display the report html properly
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "resultsFormatting", function (resultsFormattingConf) {
                        resultsFormattingConfig = resultsFormattingConf;
                    });
                    if (resultsFormattingConfig && lang.isObject(resultsFormattingConfig)) {
                        if (resultsFormattingConfig.displayFormats && lang.isObject(resultsFormattingConfig.displayFormats)) {
                            this.displayFormats = resultsFormattingConfig.displayFormats;
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
                /**
                 * kicks of the report generation
                 * @private
                 */
                _generateReport: function () {
                    if (this.viewModel.selectedReportFormat() == this.viewModel.HTML) {
                        if (this.viewModel.selectedExtractMode() === this.viewModel.draw && this.currentDrawGraphic == null) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Clip extent required");
                            VIEWER_UTILS.log("Could not generate report. A Clip extent is required", VIEWER_GLOBALS.LOG_TYPE.WARNING);
                            return;
                        }
                        this._generateHTMLReport();
                    }
                    else if (this.viewModel.selectedReportFormat() == this.viewModel.PDF) {
                        this._generatePDFReport();
                    }
                    else {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Invalid Reporting Mode");
                        VIEWER_UTILS.log("Invalid Reporting Mode", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return;
                    }
                    VIEWER_UTILS.log("Generating Report", VIEWER_GLOBALS.LOG_TYPE.INFO);
                },
                /**
                 * returns the requested report extent
                 * @return {*}
                 * @private
                 */
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
                /**
                 * queries layer for results by the passed extent
                 * @param queryLayerController
                 * @param lockRasters
                 * @param extent
                 * @param returnGeometry
                 * @return {*}
                 */
                queryForResultsByExtent: function (queryLayerController, lockRasters, extent, returnGeometry) {
                    if (returnGeometry == null) {
                        returnGeometry = true;
                    }
                    var queryLayer = queryLayerController.layer;
                    var queryUrl = queryLayer.url;
                    var queryTask = new QueryTask(queryUrl);
                    var query = new Query();
                    //get the out fields
                    query.outFields = [];
                    var visibleCartFieldNames;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.GET_VISIBLE_FIELD_NAMES, function (viCtFdNms) {
                        visibleCartFieldNames = viCtFdNms;
                    });
                    if (visibleCartFieldNames.length == 0) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There are no columns in the result grid");
                        VIEWER_UTILS.log("Could not generate report. There are no columns in the result grid.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return;
                    }
                    for (var i = 0; i < visibleCartFieldNames.length; i++) {
                        var fieldExistsAndTrueFieldName = IMAGERY_UTILS.getFieldExistsAndServiceFieldName(visibleCartFieldNames[i], queryLayerController);
                        if (fieldExistsAndTrueFieldName.exists) {
                            query.outFields.push(fieldExistsAndTrueFieldName.fieldName);
                        }
                    }
                    query.geometry = extent;
                    query.objectIds = lockRasters;
                    query.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                    query.returnGeometry = returnGeometry;
                    return queryTask.execute(query);
                },
                /**
                 * returns the current base map url
                 * @return {*}
                 * @private
                 */
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
                _generatePDFReport: function () {
                    var layoutTemplate = this.viewModel.selectedPdfTemplate();
                    if (layoutTemplate == null) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Invalid PDF Layout Template");
                        VIEWER_UTILS.log("Invalid PDF Layout Template", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return;
                    }
                    var printTemplate = new PrintTemplate();

                    var mapSize = this.reportingConfiguration.pdf.mapSize;
                    if (mapSize == null) {
                        mapSize = {height: 500, width: 500}
                    }
                    var dpi = this.reportingConfiguration.pdf.mapDPI;
                    if (dpi == null) {
                        dpi = 96;
                    }
                    printTemplate.exportOptions = {};
                    printTemplate.exportOptions.width = mapSize.width;
                    printTemplate.exportOptions.height = mapSize.height;
                    printTemplate.exportOptions.dpi = dpi;
                    printTemplate.format = "PDF";

                    printTemplate.layoutOptions = {};

                    var title = this.viewModel.pdfTitle();
                    if (title != null && title != "") {
                        printTemplate.layoutOptions.titleText = title;
                    }

                    if (this.reportingConfiguration.pdf.layoutOptions) {
                        lang.mixin(printTemplate.layoutOptions, this.reportingConfiguration.pdf.layoutOptions || {});
                    }

                    printTemplate.layout = layoutTemplate;
                    printTemplate.preserveScale = this.reportingConfiguration.pdf.preserveMapScale == null ? false : this.reportingConfiguration.pdf.preserveMapScale;
                    var printParameters = new PrintParameters();
                    printParameters.template = printTemplate;

                    var mapRef;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GET, function (responseMap) {
                        mapRef = responseMap;
                    });
                    printParameters.map = mapRef;
                    if (this._printTask == null) {
                        this._printTask = new PrintTask(this.reportingConfiguration.pdf.exportWebMapTaskURL)
                    }
                    VIEWER_UTILS.log("Generating PDF", VIEWER_GLOBALS.LOG_TYPE.INFO);
                    this._printTask.execute(printParameters, lang.hitch(this, this._handlePDFExportResponse), lang.hitch(this, this._handlePDFExportError));
                },
                _handlePDFExportResponse: function (response) {
                    if (response && response.url) {
                        window.open(response.url);
                    }
                    else {
                        this._handlePDFExportError();
                    }
                },
                _handlePDFExportError: function (err) {
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not generate PDF report. Web Map export task failed.");
                    VIEWER_UTILS.log("Could not generate PDF report. Web Map export task failed.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                },
                /**
                 * generate the html report
                 * @private
                 */
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
                            var queryTaskDeferred = this.queryForResultsByExtent(currentQueryLayerController,
                                currentMosaicRule.lockRasterIds, extent, false);
                            queryTaskDeferred.then(lang.hitch(this, this._handleResultsByExtentResponse, currentQueryLayerController));
                        }
                    }
                },
                /**
                 * handles server response for query against passed extent
                 * @param queryLayerController
                 * @param queryResponse
                 * @private
                 */
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
                    var fieldMapping = (queryLayerController.serviceConfiguration && queryLayerController.serviceConfiguration.fieldMapping) ? queryLayerController.serviceConfiguration.fieldMapping : {};
                    var fieldTypeLookup = {domains: {}, dates: {}};
                    var currentFeature;
                    var currentAttributes;
                    var currentValue;
                    var convertFieldName;
                    var newFieldName;
                    var currentField;
                    // var newFieldName;
                    var currentFieldType;
                    var i;
                    //the main idea is to figure out the label of the grid column from the result field of the service. field mapping complicate this process.
                    //we need to convert service field names -> mapping field name in configuration -> label displayed in the result grid
                    //convert the header field names to the labels in the viewer
                    if (this.resultFieldsLabelLookup && lang.isObject(this.resultFieldsLabelLookup)) {
                        if (queryResponseJson.fields && lang.isArray(queryResponseJson.fields)) {
                            var currentFieldName;
                            for (i = 0; i < queryResponseJson.fields.length; i++) {
                                currentField = queryResponseJson.fields[i];
                                //see if there is a field mapping for this field
                                currentFieldName = fieldMapping[currentField.name] != null ? fieldMapping[currentField.name] : currentField.name;
                                currentFieldType = currentField.type;
                                if (this.resultFieldsLabelLookup[currentFieldName]) {
                                    newFieldName = this.resultFieldsLabelLookup[currentFieldName];
                                    queryResponseJson.fields[i].name = newFieldName;
                                    if (currentFieldType == VIEWER_GLOBALS.ESRI_FIELD_TYPES.DATE) {
                                        fieldTypeLookup.dates[newFieldName] = newFieldName;
                                    }
                                    else if (currentField.domain != null && lang.isObject(currentField.domain)) {
                                        fieldTypeLookup.domains[newFieldName] = IMAGERY_UTILS.codedValuesDomainToHash(currentField.domain.codedValues);
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
                            var currentAttributeFieldName;
                            var attributeKeysArray = [];
                            for (var key in currentAttributes) {
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
                                    delete currentAttributes[currKey];
                                    //replace
                                    convertFieldName = this.resultFieldsLabelLookup[currentAttributeFieldName];

                                    //check for value formatter
                                    if (fieldTypeLookup.dates[convertFieldName] != null) {
                                        //convert the date
                                        currentValue = this.getFormattedDate(currentValue,queryLayerController.serviceConfiguration.isUTCDate);
                                    }
                                    else if (fieldTypeLookup.domains[convertFieldName] != null) {
                                        currentValue = fieldTypeLookup.domains[convertFieldName][currentValue];
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
                /**
                 * displays the html report in a new window
                 * @private
                 */
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
                /**
                 * generates the table parameters for the html report <table> element
                 * @param serviceQueryResponses
                 * @return {{displayFormats: {}, tableDataArray: Array, displayFields: *, hasSourceField: boolean}}
                 * @private
                 */
                _generateTableParameters: function (serviceQueryResponses) {
                    var i;
                    var tableDataArray = [];
                    var currentServiceQueryResponse;
                    //{featureSet: queryResponseJson, layer: layer})
                    var displayFormats = {};
                    if (this.displayFormats && this.displayFormats.date) {
                        displayFormats.date = this.displayFormats.date;
                    }
                    for (i = 0; i < serviceQueryResponses.length; i++) {
                        currentServiceQueryResponse = serviceQueryResponses[i];
                        var layer = currentServiceQueryResponse.queryLayerController.layer;
                        tableDataArray.push({
                            objectIdField: layer.objectIdField,
                            source: currentServiceQueryResponse.queryLayerController.label,
                            featureSet: currentServiceQueryResponse.featureSet
                        });
                    }
                    //we only want to render the fields that are visible in the shopping cart grid
                    var visibleCartFieldNames;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.GET_VISIBLE_FIELD_NAMES, function (viCtFdNms) {
                        visibleCartFieldNames = viCtFdNms;
                    });
                    var reportRenderFields = [];
                    var currentResultField;
                    for (i = 0; i < this.resultFields.length; i++) {
                        currentResultField = this.resultFields[i];
                        if (array.indexOf(visibleCartFieldNames, currentResultField.field) > -1) {
                            reportRenderFields.push(currentResultField);
                        }
                    }
                    return{
                        displayFormats: displayFormats,
                        tableDataArray: tableDataArray,
                        displayFields: reportRenderFields,
                        hasSourceField: true
                    }
                },
                /**
                 * generates the map parameters for the html report map control
                 * @param serviceQueryResponses
                 * @return {{basemap: *, extent: *, displayData: Array}}
                 * @private
                 */
                _generateMapParameters: function (serviceQueryResponses) {
                    var extent = this._getRequestedExtentGeometry();
                    if (extent == null) {
                        return {};
                    }
                    var currentBaseMap = this._getCurrentBasemapUrl();
                    if (currentBaseMap == null) {
                        return {};
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
                getFormattedDate: function (value, isUTC) {
                    try {
                        var date = new Date(value);
                        if (isUTC) {
                            date = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
                        }
                        var formatter = (this.displayFormats != null && this.displayFormats.date != null) ? this.displayFormats.date : this.__defaultDateFormat;
                        return locale.format(date, {selector: "date", datePattern: formatter});
                    }
                    catch (err) {
                        return null;
                    }
                }
            });
    });