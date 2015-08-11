define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "esriviewer/ui/base/UIWidget",
    "dojo/store/Memory",
    "dijit/form/CheckBox",
    "./ImageryGridBase",
    "./GridFormattersMixin",
    "./RowActionsMixin",
    "dojo/store/Observable"
],
    //this is the class to extend if you need an image discovery grid
    function (declare, topic, lang, domConstruct, UIWidget, Memory, CheckBox, ImageryGridBase, GridFormattersMixin, RowActionsMixin, Observable) {
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
                    this.utcDateFormatterScoped = lang.hitch(this, this.utcDateFormatter);
                    this.dateFormatterScoped = lang.hitch(this, this.dateFormatter);
                    this.fieldsFormattersByQueryControllerId = {};
                },
                postCreate: function () {
                    this.inherited(arguments);

                    //check to see if we display the source column
                    var singleSourceMode = true;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (queryLayerControllers) {
                        if (queryLayerControllers != null && queryLayerControllers.length > 1) {
                            singleSourceMode = false;
                        }
                    });
                    if (singleSourceMode) {
                        this.addSourceColumn = false;
                    }
                    this.createGrid();
                },
                /**
                 * loads the required discovery viewer configuration that the grid will use
                 */
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
                /**
                 * expands the grid
                 */
                expandGrid: function () {
                    this.grid.expand();
                },
                /**
                 * shrinks the grid
                 */
                shrinkGrid: function () {
                    this.grid.shrink();
                },
                /**
                 * clears the grid and removes all results
                 */
                clearGrid: function () {
                    //clears the grid. removes all items from the grid and removes imagery/footprints from the map
                    if (this.thumbnailHeaderCheckbox) {
                        this.thumbnailHeaderCheckbox.set("checked", false);
                    }
                    this.createNewStore();
                    this.setSelectedThumbnails();
                },
                /**
                 * creates a new store for the grid
                 */
                createNewStore: function () {
                    //sets the store of the grid to an empty store. this is called when results are to be cleared
                    this.store = new Observable(new Memory({ data: [], idProperty: this.storeIdField}));
                    this.grid.set("store", this.store);
                },
                createNewGridStoreFromData: function (data) {
                    //taking in an array of items this will create and set a store for the grid. this is much fast than the previous method of adding items one by one to the grid
                    this.store = new Observable(new Memory({ data: data, idProperty: this.storeIdField}));
                    this.grid.set("store", this.store);
                },
                /**
                 * disables the thumbnail toggle buttons
                 */
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
                /**
                 * enabled the thumbnail toggle buttons
                 */
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
                /**
                 * disables rows in the grid by function
                 * @param isDisabledFunction function that takes in an item and returns true is the row is to be disabled
                 */
                grayOutRowsByFunction: function (isDisabledFunction) {
                    if (this.grid) {
                        this.grid.setGrayedOutRows(isDisabledFunction);
                        this.setSelectedThumbnails();
                    }
                },
                /**
                 * clears the grayed out rows in the grid. rows are not removed from the grid
                 */
                clearGrayedOutRows: function () {
                    if (this.grid) {
                        this.grid.clearGrayedOutRows();
                        this.setSelectedThumbnails();
                    }
                },
                /**
                 * create the add-on columns in the grid
                 * @return {Array} columns to add to the grid
                 */
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
                /**
                 * generates the columns specified in the discovery applications configuration file
                 * @return {Array} columns to add to the grid
                 */
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
                    //get all of the query controllers
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (queryConts) {
                        queryControllers = queryConts;
                    });
                    if (queryControllers && lang.isArray(queryControllers)) {
                        var currentQueryCont;
                        var currentLayer;
                        var currentField;
                        //loops through the controllers to set up field aliases for each controller
                        for (i = 0; i < queryControllers.length; i++) {
                            currentQueryCont = queryControllers[i];
                            var controllerFormatterLookup = {};
                            this.fieldsFormattersByQueryControllerId[currentQueryCont.id] = controllerFormatterLookup;
                            currentLayer = currentQueryCont.layer;
                            //loop through the fields of the query layer controller
                            if (currentLayer && currentLayer.fields) {
                                for (j = 0; j < currentLayer.fields.length; j++) {
                                    currentFormatter = null;
                                    currentField = currentLayer.fields[j];
                                    if (currentField.type === VIEWER_GLOBALS.ESRI_FIELD_TYPES.DATE) {
                                        currentFormatter  = currentQueryCont.serviceConfiguration.isUTCDate ? this.utcDateFormatterScoped : this.dateFormatterScoped;
                                    }
                                    else if (currentField.type === VIEWER_GLOBALS.ESRI_FIELD_TYPES.DOUBLE && this.floatPrecision != null) {
                                        //TODO: double formatting has been disabled. need to format on a column level and not a grid level
                                    }
                                    else if (currentField.domain != null && currentField.domain.codedValues != null) {
                                        currentFormatter = lang.hitch(this, this.domainFormatter, IMAGERY_UTILS.codedValuesDomainToHash(currentField.domain.codedValues));
                                    }
                                    if (currentFormatter != null) {
                                        var hasFieldMapping = false;
                                        //check for fieldMapping on the query layer controller and set formatter on the alias too
                                        if (currentQueryCont.serviceConfiguration && currentQueryCont.serviceConfiguration.fieldMapping != null && lang.isObject(currentQueryCont.serviceConfiguration.fieldMapping)) {
                                            var fieldMapping = currentQueryCont.serviceConfiguration.fieldMapping;
                                            if (fieldMapping[currentField.name] != null) {
                                                controllerFormatterLookup[fieldMapping[currentField.name]] = currentFormatter;
                                                hasFieldMapping = true;
                                            }

                                        }
                                        if (!hasFieldMapping) {
                                            controllerFormatterLookup[currentField.name] = currentFormatter;
                                        }
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
                refresh: function () {
                    if (this.grid) {
                        this.grid.refresh();
                    }

                },
                /**
                 * creates the inner grid
                 */
                createGrid: function () {
                    //setup the columns
                    var columns = this.generateManipulationColumns();
                    var layerColumns = this.generateLayerColumns();
                    columns = columns.concat(layerColumns);
                    //setup the store
                    this.store = new Observable(new Memory({ data: [], idProperty: this.storeIdField}));
                    this.grid = new ImageryGridBase({
                        columns: columns,
                        store: this.store
                    });
                    //listen for sort. lock raster is based on the ordering of the grid
                    this.grid.on("dgrid-sort", lang.hitch(this, this.handleGridSort));
                    domConstruct.place(this.grid.domNode, this.domNode);
                },
                /**
                 * called when the grid is sorted. lock raster is ordered by the current sorting of the grid
                 * @param evt
                 */
                handleGridSort: function (evt) {
                    if (evt && evt.sort) {
                        this.setSelectedThumbnailsSorted(evt.sort);
                    }
                },
                /* Header Renderers */
                /**
                 * renders the thumbnail column in the grid
                 * @param node
                 */
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

                /**
                 *  returns the object ids for visible items in the grid
                 * @return {Array}
                 */
                getVisibleContentObjectIdArray: function (params) {
                    if (params == null) {
                        params = {};
                    }
                    lang.mixin(params, {isFiltered: false});
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
                /**
                 * clones all visible items in the grid
                 * @param ignoreFieldsLookup fields to ignore when cloning grid items
                 * @return {Array} array of cloned items
                 */
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
                /**
                 *  gets the unique values for rows that are visible on the map
                 * @param fieldsArray fields to return for grid items
                 * @param queryParams query to use against the grid store. only items that pass the query are returned
                 * @return {*}
                 */
                getUniqueVisibleThumbnailAttributes: function (fieldsArray, queryParams) {
                    if (queryParams == null) {
                        queryParams = {};
                    }
                    queryParams.showThumbNail = true;
                    return this.getUniqueVisibleGridAttributes(fieldsArray, queryParams);
                },
                /**
                 *  gets the unique values for rows that are visible in the grid
                 * @param fieldsArray fields to return for grid items
                 * @param queryParams  query to use against the grid store. only items that pass the query are returned
                 * @return {{}}
                 */
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
                /**
                 * returns the count of visible items in the grid
                 * @return {*}
                 */
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