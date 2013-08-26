define([
    "dojo/_base/declare",
    "dojo/topic",
    "dijit/registry",
    "dojo/query",
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/store/Observable",
    "esriviewer/ui/base/UIWidget",
    "dojo/on",
    "dojo/store/Memory",
    "dijit/form/CheckBox",
    "./ImageryGridBase",
    "./GridFormattersMixin",
    "./RowActionsMixin"
],
    //this is the class to extend if you need an image discovery grid
    function (declare, topic, registry, query, domStyle, lang, domConstruct, Observable, UIWidget, on, Memory, CheckBox, Grid, GridFormattersMixin, RowActionsMixin) {
        return declare(
            [UIWidget, GridFormattersMixin, RowActionsMixin],
            {
                addSourceColumn: true,
                allowCheckAllThumbnails: true,
                thumbnailToggleDisabled: false,
                internalFieldsLookup: {
                    addedToCart: "addedToCart",
                    isFiltered: "isFiltered",
                    showThumbNail: "showThumbNail",
                    //  showFootprint: "showFootprint",
                    _storeId: "_storeId"
                },
                //default formatters
                __defaultDisplayFormats: {
                    date: "dd-MM-yyyy"
                },
                displayFormats: {
                    date: "dd-MM-yyyy"
                },
                tempFootprintHideStateActive: false,
                gridHeight: "160px",
                storeIdField: "_storeId",
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    this.setSelectedThumbCallback = lang.hitch(this, this.setSelectedThumbnails);
                    this.dateFormatterScoped = lang.hitch(this, this.dateFormatter);
                    this.doubleFormatterScoped = lang.hitch(this, this.doubleFormatter);
                    this.stringFormatterScoped = lang.hitch(this, this.stringFormatter);
                    this.fieldsFormattersByQueryControllerId = {};
                    this.fieldStyleByQueryControllerId = {};
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.createGrid();
                },
                loadViewerConfigurationData: function () {
                    //get the fields to display from configuration
                    var displayFieldsConfig;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "imageQueryResultDisplayFields", function (displayFieldsConf) {
                        displayFieldsConfig = displayFieldsConf;
                    });
                    if (displayFieldsConfig != null && lang.isObject(displayFieldsConfig)) {
                        this.resultFields = displayFieldsConfig;
                    }
                    var resultsFormatters = null;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "resultsFormatting", function (resultsFormattingConf) {
                        resultsFormatters = resultsFormattingConf;
                    });
                    if (resultsFormatters && lang.isObject(resultsFormatters)) {
                        if (resultsFormatters.displayFormats && lang.isObject(resultsFormatters.displayFormats)) {
                            this.displayFormats = resultsFormatters.displayFormats;
                        }
                        if (resultsFormatters.floatPrecision != null) {
                            this.floatPrecision = parseInt(resultsFormatters.floatPrecision, 10);
                        }
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
                expandGrid: function () {
                    this.grid.expand();
                },
                shrinkGrid: function () {
                    this.grid.shrink();
                },
                clearGrid: function () {
                    //clears the grid. removes all items from the grid and removes imagery/footprints from the map
                    if (this.thumbnailHeaderCheckbox) {
                        this.thumbnailHeaderCheckbox.set("checked", false);
                    }
                    this.createNewStore();
                    this.setSelectedThumbnails();
                },
                createNewStore: function () {
                    this.store = new Observable(new Memory({ data: [], idProperty: this.storeIdField}));
                    this.grid.set("store", this.store);
                },
                disableThumbnailToggle: function () {
                    //disable the from toggling the thumbnail checkbox
                    this.thumbnailToggleDisabled = true;
                    if (this.thumbnailHeaderCheckbox) {
                        this.thumbnailHeaderCheckbox.set("disabled", true);
                    }
                    if (this.grid) {
                        this.grid.disableThumbnailToggle();
                    }
                },
                enableThumbnailToggle: function () {
                    //allow the user to toggle the thumbnail checkbox
                    this.thumbnailToggleDisabled = false;
                    if (this.thumbnailHeaderCheckbox) {
                        this.thumbnailHeaderCheckbox.set("disabled", false);
                    }
                    if (this.grid) {
                        this.grid.enableThumbnailToggle();
                    }
                },
                grayOutRowsByFunction: function (isDisabledFunction) {
                    if (this.grid) {
                        this.grid.setGrayedOutRows(isDisabledFunction);
                        this.setSelectedThumbnails();
                    }
                },
                clearGrayedOutRows: function () {
                    if (this.grid) {
                        this.grid.clearGrayedOutRows();
                        this.setSelectedThumbnails();
                    }
                },
                generateManipulationColumns: function () {
                    //add-on fields for the discovery grid. these are appended to the fields from the configuration file
                    return [
                        {
                            field: "zoomToFootprint",
                            label: " ",
                            sortable: false,
                            renderCell: lang.hitch(this, this.zoomToIconFormatter),
                            unhidable: true
                        },

                        {
                            field: "showThumbNail",
                            label: " ",
                            sortable: false,
                            renderCell: lang.hitch(this, this.thumbnailCheckboxFormatter),
                            renderHeaderCell: lang.hitch(this, this.thumbnailRenderHeaderCell),
                            unhidable: true
                        }
                    ];
                },
                generateLayerColumns: function () {
                    var i;
                    var j;
                    var key;
                    var columnToFormatterLookup = {};
                    var layerColumns = [];
                    //add the requested fields to the grid
                    var currentResultField;
                    var currentFormatter;
                    var queryControllers;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (queryConts) {
                        queryControllers = queryConts;
                    });
                    if (queryControllers && lang.isArray(queryControllers)) {
                        var currentQueryCont;
                        var currentLayer;
                        var currentField;
                        for (i = 0; i < queryControllers.length; i++) {
                            currentQueryCont = queryControllers[i];
                            var controllerFormatterLookup = {};
                            this.fieldsFormattersByQueryControllerId[currentQueryCont.id] = controllerFormatterLookup;
                            currentLayer = currentQueryCont.layer;
                            if (currentLayer && currentLayer.fields) {
                                for (j = 0; j < currentLayer.fields.length; j++) {
                                    currentFormatter = null;
                                    currentField = currentLayer.fields[j];
                                    if (currentField.type === VIEWER_GLOBALS.ESRI_FIELD_TYPES.DATE) {
                                        currentFormatter = this.dateFormatterScoped;
                                    }
                                    else if (currentField.type === VIEWER_GLOBALS.ESRI_FIELD_TYPES.DOUBLE && this.floatPrecision != null) {
                                        currentFormatter = this.doubleFormatterScoped;
                                    }
                                    else if (currentField.domain != null && currentField.domain.codedValues != null) {
                                        currentFormatter = lang.hitch(this, this.domainFormatter, currentField.domain.codedValues);
                                    }
                                    if (currentFormatter != null) {
                                        controllerFormatterLookup[currentField.name] = currentFormatter;
                                    }
                                }
                            }
                        }
                    }
                    //add the source column
                    if (this.addSourceColumn) {
                        var sourceColumn = {
                            field: "__serviceLabel",
                            label: "Source",
                            sortable: true
                        };
                        layerColumns.push(sourceColumn);
                    }
                    var gridOptions;
                    if (this.resultFields != null && lang.isArray(this.resultFields)) {
                        for (i = 0; i < this.resultFields.length; i++) {
                            currentResultField = this.resultFields[i];
                            //lookup field in the layer  to see if it requires a formatter
                            var columnObj = {
                                field: currentResultField.field,
                                label: currentResultField.label
                            };

                            if (currentResultField.gridOptions != null && lang.isObject(currentResultField.gridOptions)) {
                                gridOptions = currentResultField.gridOptions;
                                if (gridOptions.hiddenOnDisplay != null && gridOptions.hiddenOnDisplay === true) {
                                    columnObj.hidden = true;
                                }
                                if (gridOptions.canHide != null && gridOptions.canHide === false) {
                                    columnObj.unhidable = true;
                                }
                            }
                            columnObj.renderCell = lang.hitch(this, this.definedResultFieldFormatter, currentResultField.field);
                            layerColumns.push(columnObj);
                        }
                    }
                    return layerColumns;
                },
                createGrid: function () {
                    //setup the columns
                    var columns = this.generateManipulationColumns();
                    var layerColumns = this.generateLayerColumns();
                    columns = columns.concat(layerColumns);
                    //setup the store
                    this.store = new Observable(new Memory({ data: [], idProperty: this.storeIdField}));
                    this.grid = new Grid({
                        columns: columns,
                        store: this.store
                    });
                    //listen for sort. lock raster is based on the ordering of the grid
                    this.grid.on("dgrid-sort", lang.hitch(this, this.handleGridSort));
                    domConstruct.place(this.grid.domNode, this.domNode);
                },
                handleGridSort: function (evt) {
                    if (evt && evt.sort) {
                        this.setSelectedThumbnailsSorted(evt.sort);
                    }
                },
                /* Header Renderers */
                thumbnailRenderHeaderCell: function (node) {
                    var infoIcon = domConstruct.create("div", { title: "Toggle Thumbnails", className: "imageGridThumbnailHeaderIcon"});
                    if (this.allowCheckAllThumbnails) {
                        this.thumbnailHeaderCheckbox = new CheckBox({disabled: this.thumbnailToggleDisabled});
                        this.thumbnailHeaderCheckbox.on("change", lang.hitch(this, this.handleToggleAllThumbnails));
                        domConstruct.place(this.thumbnailHeaderCheckbox.domNode, node);
                    }
                    domConstruct.place(infoIcon, node);
                },
                /*End  Header Renderers */

                /* Handle Result click/select */
                getVisibleContentObjectIdArray: function () {
                    var items = this.store.query({isFiltered: false});
                    var queryLayerControllerItemsArray = IMAGERY_UTILS.sortItemsIntoQueryControllerArray(items);
                    var queryLayerControllerObjectIdsArray = [];
                    var currentQueryLayerController;
                    var currentQueryLayerControllerItems;
                    for (var i = 0; i < queryLayerControllerItemsArray.length; i++) {
                        currentQueryLayerController = queryLayerControllerItemsArray[i].queryController;
                        currentQueryLayerControllerItems = queryLayerControllerItemsArray[i].items;
                        var objectIdArr = [];
                        queryLayerControllerObjectIdsArray.push({queryController: currentQueryLayerController, objectIds: objectIdArr});
                        for (var j = 0; j < currentQueryLayerControllerItems.length; j++) {
                            objectIdArr.push(currentQueryLayerControllerItems[j][currentQueryLayerController.layer.objectIdField]);
                        }
                    }
                    return queryLayerControllerObjectIdsArray;
                },
                cloneVisibleItems: function (ignoreFieldsLookup) {
                    var clonedItems = [];

                    if (ignoreFieldsLookup == null) {
                        ignoreFieldsLookup = {};
                    }
                    var items = this.store.query({isFiltered: false});
                    var key;
                    for (var i = 0; i < items.length; i++) {
                        var clonedItem = lang.clone(items[i]);
                        for (key in ignoreFieldsLookup) {
                            delete clonedItem[key];
                        }
                        for (key in this.internalFieldsLookup) {
                            delete clonedItem[key];
                        }
                        clonedItems.push(clonedItem);
                    }
                    return clonedItems;
                },
                //gets the unique values for rows that are visible on the map
                getUniqueVisibleThumbnailAttributes: function (fieldsArray, queryParams) {
                    if (queryParams == null) {
                        queryParams = {};
                    }
                    queryParams.showThumbNail = true;
                    return this.getUniqueVisibleGridAttributes(fieldsArray, queryParams);
                },
                //gets the unique values for rows that are visible in the grid
                getUniqueVisibleGridAttributes: function (fieldsArray, queryParams) {
                    if (fieldsArray == null || !lang.isArray(fieldsArray) || fieldsArray.length == 0) {
                        return {};
                    }
                    var tempUniqueLookup = {};
                    var fieldsObj = {};
                    var i;
                    for (i = 0; i < fieldsArray.length; i++) {
                        fieldsObj[fieldsArray[i]] = [];
                        tempUniqueLookup[fieldsArray[i]] = {};
                    }
                    var currentItem;
                    var queryFilter = {isFiltered: false};
                    if (queryParams != null && lang.isObject(queryParams)) {
                        lang.mixin(queryFilter, queryParams);
                    }
                    var items = this.store.query(queryFilter);
                    for (i = 0; i < items.length; i++) {
                        currentItem = items[i];
                        for (var key in fieldsObj) {
                            if (currentItem[key] == null || currentItem[key] == "") {
                                continue;
                            }
                            if (tempUniqueLookup[key][currentItem[key]] == null) {
                                fieldsObj[key].push(currentItem[key]);
                                tempUniqueLookup[key][currentItem[key]] = currentItem[key];
                            }
                        }
                    }
                    return fieldsObj;
                },
                getVisibleItemCount: function () {
                    var items = this.store.query();
                    return items.length;
                },
                /* End Handle Result click/select */
                startup: function () {
                    //start the grid
                    if (this.grid) {
                        this.grid.startup();
                    }
                },
                //todo: need to test this
                destroy: function () {
                    if (this.grid && lang.isFunction(this.grid.destroy)) {
                        this.grid.destroy();
                    }
                    if (this.store) {
                        this.store = null;
                    }
                }
            });
    });