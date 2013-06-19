define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageQueryWidgetTemplate.html",
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
    "esriviewer/map/base/LayerQueryParameters"
],
    function (declare, template, topic, array, on, domConstruct, domStyle, FilteringSelect, Memory, ContentPane, lang, UITemplatedWidget, AddedFieldValuesTooltip, LayerQueryParameters) {
        return declare(
            [ContentPane, UITemplatedWidget],
            {
                selectWidth: "80%",
                maxSelectHeight: "200px",
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
                initListeners: function () {
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
                    if (currentQueryLayerController == null || currentQueryLayerController.layer == null) {
                        return;
                    }
                    this.clearQueryFieldEntries();
                    if (this.queryFieldResponseCache[currentQueryLayerController.id]) {
                        this.createQueryFieldEntryElements(this.queryFieldResponseCache[currentQueryLayerController.id]);
                    }
                    else {
                        var queryParamsForLayer = new LayerQueryParameters({
                            layer: currentQueryLayerController.layer,
                            returnGeometry: false,
                            outFields: this.queryFields,
                            callback: lang.hitch(this, this.handleQueryFieldValuesResponse, currentQueryLayerController),
                            errback: lang.hitch(this,this.handleQueryFieldValuesError)
                        });
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.SEARCH.GET_VALUES_FOR_FIELDS,queryParamsForLayer );
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
                handleQueryFieldValuesError: function(){
                    this.onNoUniqueValuesReturned();
                },
                handleQueryFieldValuesResponse: function (queryLayerController, queryFieldValuesResponse) {
                    if (queryFieldValuesResponse && lang.isObject(queryFieldValuesResponse) && queryFieldValuesResponse.features) {
                        var valuesLookup = {};
                        var usedValuesLookup = {};
                        var currentFeature;
                        if(queryFieldValuesResponse.features.length == 0){
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

                    var addIcon = domConstruct.create("div", {title: "Add Value", className: "commonIcons16 add imageDiscoveryQueryAddFieldValueIcon"});
                    on(addIcon, "click", lang.hitch(this, this.addFieldValueToQueryList, fieldName));
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
                    domConstruct.place(queryFilterLabel, queryFilterEntryContainer);
                    domConstruct.place(addIcon, queryFilterEntryContainer);
                    domConstruct.place(filteringSelect.domNode, queryFilterEntryContainer);
                    domConstruct.place(infoIcon, queryFilterEntryContainer);
                    domConstruct.place(queryFilterEntryContainer, this.queryFieldEntries);

                },
                addFieldValueToQueryList: function (fieldName) {
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
                    var queryString = "";
                    var currentTooltip;
                    var currentFieldValues;
                    var isStringField;
                    var idx = 0;
                    for (var key in this.addedFieldValuesTooltipLookup) {
                        isStringField = array.indexOf(this.stringFieldNames,key) > -1;
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
                onNoUniqueValuesReturned: function(){

                }
            });
    });