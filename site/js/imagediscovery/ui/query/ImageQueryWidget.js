define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageQueryWidgetTemplate.html",
    //   "xstyle/css!./theme/ImageQueryWidgetTheme.css",
    "dojo/topic",
    "dojo/_base/array",
    "dojo/on",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dijit/form/FilteringSelect",
    "dojo/store/Memory",
    'dijit/layout/ContentPane',
    "dojo/_base/lang",
    "esriviewer/ui/base/UITemplatedWidget",
    "./base/AddedFieldValuesTooltip",
    "esriviewer/map/base/LayerQueryParameters",
    "esriviewer/map/base/DistinctValuesQueryParameters"
],
    //  function (declare, template, theme, topic, array, on, domConstruct, domStyle, FilteringSelect, Memory, ContentPane, lang, UITemplatedWidget, AddedFieldValuesTooltip, LayerQueryParameters) {
    function (declare, template, topic, array, on, domConstruct, domStyle, FilteringSelect, Memory, ContentPane, lang, UITemplatedWidget, AddedFieldValuesTooltip, LayerQueryParameters, DistinctValuesQueryParameters) {
        return declare(
            [ContentPane, UITemplatedWidget],
            {
                _distinctLayerVersionSupported: 10.1,
                selectWidth: "80%",
                maxSelectHeight: 200,
                templateString: template,
                constructor: function () {
                    this.stringFieldNames = [];
                    this.discoveryQueryFields = null;
                    this.filterSelectCacheByFieldName = {};
                    this.fieldNameToLabelLookup = {};
                    this.addedFieldValuesTooltipLookup = {};
                    this.queryFields = [];
                    this.queryFieldResponseCache = {};
                },
                postCreate: function () {
                    this.inherited(arguments);
                    if (this.discoveryQueryFields != null && lang.isArray(this.discoveryQueryFields)) {
                        for (var i = 0; i < this.discoveryQueryFields.length; i++) {
                            this.queryFields.push(this.discoveryQueryFields[i].field);
                            this.fieldNameToLabelLookup[this.discoveryQueryFields[i].field] = this.discoveryQueryFields[i].label;
                        }
                    }
                },
                setCurrentQueryLayerController: function (currentQueryLayerController) {
                    //for unique values there has to be a single active query layer controller. this widget is not active when searching all services
                    if (currentQueryLayerController == null || currentQueryLayerController.layer == null) {
                        return;
                    }
                    this.stringFieldNames = [];
                    //set the string values
                    var currentField;
                    var i;
                    for (i = 0; i < currentQueryLayerController.layer.fields.length; i++) {
                        currentField = currentQueryLayerController.layer.fields[i];
                        if (currentField.type === VIEWER_GLOBALS.ESRI_FIELD_TYPES.STRING) {
                            this.stringFieldNames.push(currentField.name);
                        }
                    }

                    this.clearQueryFieldEntries();
                    if (this.queryFieldResponseCache[currentQueryLayerController.id]) {
                        this.createQueryFieldEntryElements(this.queryFieldResponseCache[currentQueryLayerController.id]);
                    }
                    else {
                        if (currentQueryLayerController.layer.version < this._distinctLayerVersionSupported) {
                            var queryParamsForLayer = new LayerQueryParameters({
                                layer: currentQueryLayerController.layer,
                                returnGeometry: false,
                                outFields: this.queryFields,
                                callback: lang.hitch(this, this.handleQueryFieldValuesResponse, currentQueryLayerController),
                                errback: lang.hitch(this, this.handleQueryFieldValuesError)
                            });

                            topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.SEARCH.GET_VALUES_FOR_FIELDS, queryParamsForLayer);
                        }
                        else {

                            for (i = 0; i < this.queryFields.length; i++) {
                                var distinctParameters = new DistinctValuesQueryParameters({});
                                topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.GET_DISTINCT_FIELD_VALUES, {
                                    callback: lang.hitch(this, this.handleQueryFieldValuesResponse, currentQueryLayerController),
                                    errback: lang.hitch(this, this.handleQueryFieldValuesError),
                                    layer: currentQueryLayerController.layer,
                                    distinctField: this.queryFields[i],
                                    processResponse: false

                                });
                            }
                        }
                    }
                },
                loadViewerConfigurationData: function () {
                    //load the configuration
                    var discoveryQueryFields;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageDiscoveryQueryFields", function (discoveryQueryFieldsConf) {
                        discoveryQueryFields = discoveryQueryFieldsConf;
                    });
                    if (discoveryQueryFields != null && lang.isArray(discoveryQueryFields)) {
                        this.discoveryQueryFields = discoveryQueryFields;
                    }

                },
                populateDefaultValues: function (queryLayerControllers, imageDiscoveryQueryFieldsUniqueValuesConfig) {
                    var currentCatalogUrl;
                    var queryLayerControllerId;
                    for (var key in imageDiscoveryQueryFieldsUniqueValuesConfig) {
                        queryLayerControllerId = null;
                        currentCatalogUrl = key;
                        for (var i = 0; i < queryLayerControllers.length; i++) {
                            if (currentCatalogUrl == queryLayerControllers[i].layer.url) {
                                queryLayerControllerId = queryLayerControllers[i].id;
                                break;
                            }
                        }
                        if (queryLayerControllerId) {
                            this.queryFieldResponseCache[queryLayerControllerId] = imageDiscoveryQueryFieldsUniqueValuesConfig[key];
                        }
                    }
                },
                handleQueryFieldValuesError: function () {
                    this.onNoUniqueValuesReturned();
                },
                handleQueryFieldValuesResponse: function (queryLayerController, queryFieldValuesResponse) {
                    //populate the unique values in the users view
                    if (queryFieldValuesResponse && lang.isObject(queryFieldValuesResponse) && queryFieldValuesResponse.features) {
                        var valuesLookup = {};
                        var usedValuesLookup = {};
                        var currentFeature;
                        if (queryFieldValuesResponse.features.length == 0) {
                            this.onNoUniqueValuesReturned();
                            return;
                        }
                        for (var i = 0; i < queryFieldValuesResponse.features.length; i++) {
                            currentFeature = queryFieldValuesResponse.features[i];
                            var currentValue;
                            var currentValueAsString;
                            if (currentFeature && currentFeature.attributes) {
                                for (var key in currentFeature.attributes) {
                                    if (usedValuesLookup[key] == null) {
                                        usedValuesLookup[key] = {};
                                    }
                                    if (valuesLookup[key] == null) {
                                        valuesLookup[key] = [];
                                    }
                                    currentValue = currentFeature.attributes[key];
                                    if (currentValue == null || currentValue == "") {
                                        continue;
                                    }
                                    currentValueAsString = currentValue.toString();
                                    if (usedValuesLookup[key][currentValueAsString] == null) {
                                        valuesLookup[key].push(currentValue);
                                        usedValuesLookup[key][currentValueAsString] = "used";
                                    }
                                }
                            }
                        }
                        if (queryFieldValuesResponse.objectIdFieldName != null && valuesLookup[queryFieldValuesResponse.objectIdFieldName]) {
                            delete valuesLookup[queryFieldValuesResponse.objectIdFieldName]
                        }
                        this.queryFieldResponseCache[queryLayerController.id] = valuesLookup;
                        this.createQueryFieldEntryElements(valuesLookup);
                    }
                },
                createQueryFieldEntryElements: function (valuesLookup) {
                    for (var key in valuesLookup) {
                        var lbl = this.fieldNameToLabelLookup[key];
                        this.createQueryFieldEntryElement(lbl, key, valuesLookup[key]);
                    }
                },
                clearQueryFieldEntries: function () {
                    domConstruct.empty(this.queryFieldEntries);
                    this.addedFieldValuesTooltipLookup = {};
                },
                createQueryFieldEntryElement: function (label, fieldName, values) {
                    var queryFilterEntryContainer = domConstruct.create("div", {className: "imageQueryFieldEntryContainer"});
                    var queryFilterLabel = domConstruct.create("div", {className: "imageQueryFieldEntryLabel", innerHTML: label});
                    var filteringSelectData = [];
                    for (var i = 0; i < values.length; i++) {
                        filteringSelectData.push({name: values[i], id: values[i] });
                    }
                    var filteringSelect = new FilteringSelect({
                        required: false,
                        store: new Memory({
                            data: filteringSelectData
                        }),
                        searchAttr: "name",
                        maxHeight: this.maxSelectHeight,
                        style: {"width": this.selectWidth, "float": "left"}
                    });
                    this.filterSelectCacheByFieldName[fieldName] = filteringSelect;


                    var infoIcon = domConstruct.create("div", {className: "commonIcons16 list imageDiscoveryQueryShowAddedValuesIcon", style: {visibility: "hidden"}});
                    var addedFieldValuesTooltip = new AddedFieldValuesTooltip({
                        aroundNode: infoIcon
                    });
                    addedFieldValuesTooltip.on("empty", function () {
                        domStyle.set(infoIcon, "visibility", "hidden");
                    });
                    addedFieldValuesTooltip.on("itemAdded", function () {
                        domStyle.set(infoIcon, "visibility", "visible");
                    });
                    this.addedFieldValuesTooltipLookup[fieldName] = addedFieldValuesTooltip;
                    on(infoIcon, "click", lang.hitch(addedFieldValuesTooltip, addedFieldValuesTooltip.toggle));


                    var addIcon = domConstruct.create("div", {title: "Add Value", className: "commonIcons16 add imageDiscoveryQueryAddFieldValueIcon"});
                    on(addIcon, "click", lang.hitch(this, this.addFieldValueToQueryList, fieldName));

                    domConstruct.place(queryFilterLabel, queryFilterEntryContainer);
                    domConstruct.place(addIcon, queryFilterEntryContainer);
                    domConstruct.place(filteringSelect.domNode, queryFilterEntryContainer);
                    domConstruct.place(infoIcon, queryFilterEntryContainer);
                    domConstruct.place(queryFilterEntryContainer, this.queryFieldEntries);
                },
                addFieldValueToQueryList: function (fieldName, addedFieldValuesTooltip) {
                    if (this.addedFieldValuesTooltipLookup[fieldName]) {
                        var value = this.filterSelectCacheByFieldName[fieldName].get("value");
                        if (value != null && value != "") {
                            this.addedFieldValuesTooltipLookup[fieldName].addFieldValue(value);
                        }
                    }

                },
                showAddedFieldValues: function (fieldName) {
                },
                getQuery: function () {
                    //joins all of the unique values to be queried on into a single SQL string
                    var queryString = "";
                    var currentTooltip;
                    var currentFieldValues;
                    var isStringField;
                    var idx = 0;
                    for (var key in this.addedFieldValuesTooltipLookup) {
                        isStringField = array.indexOf(this.stringFieldNames, key) > -1;
                        currentTooltip = this.addedFieldValuesTooltipLookup[key];
                        if (currentTooltip.hasFieldValues()) {
                            currentFieldValues = currentTooltip.getFieldValues();
                            if (idx != 0) {
                                queryString += " AND ";
                            }
                            if (currentFieldValues.length == 1) {
                                queryString += key + " = " + ( isStringField ? "'" : "" ) + currentFieldValues[0] + ( isStringField ? "' " : " ");
                            }
                            else {
                                queryString += key + " IN ( ";
                                for (var i = 0; i < currentFieldValues.length; i++) {

                                    queryString += ( isStringField ? "'" : "") + currentFieldValues[i] + ( isStringField ? "' " : " ");
                                    if (i != currentFieldValues.length - 1) {
                                        queryString += " , ";
                                    }
                                }
                                queryString += " )";
                            }
                            idx++;
                        }
                    }
                    return queryString;
                },
                closePopups: function () {
                    for (var key in this.addedFieldValuesTooltipLookup) {
                        this.addedFieldValuesTooltipLookup[key].hide();
                    }
                },
                onNoUniqueValuesReturned: function () {

                }
            });
    });