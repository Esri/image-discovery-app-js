define([
    "dojo/_base/declare",
    "dgrid/OnDemandGrid",
    "dgrid/extensions/ColumnHider",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/query",
    "dijit/registry"
],
    function (declare, OnDemandGrid, ColumnHider, domClass, domStyle, lang, query, registry) {
        return declare(
            [OnDemandGrid, ColumnHider],
            {
                gridHeight: "160px",
                expandedGridHeight: "350px",
                renderRow: function (row, items) {
                    var renderedRow = this.inherited(arguments);
                    if (row.isGrayedOut) {
                        this.grayOutRow({element: renderedRow});
                    }
                    return renderedRow;
                },
                postCreate: function () {
                    this.inherited(arguments);
                    domStyle.set(this.domNode, "height", this.gridHeight);
                },
                setGrayedOutRows: function (isDisabledFunction) {
                    if (isDisabledFunction && lang.isFunction(isDisabledFunction)) {
                        var rows = this.store.query({isFiltered: false});
                        for (var i = 0; i < rows.length; i++) {
                            if (isDisabledFunction(rows[i])) {
                                var row = this.row(rows[i]);
                                if (row.element) {
                                    this.grayOutRow(row);
                                    //disable all buttons for the element
                                }
                            }
                        }
                    }
                },
                grayOutRow: function (row) {
                    if (lang.isObject(row)) {
                        domClass.add(row.element, "grayedOutGridRow");
                        if (domClass.contains(row.element, "yellowGridRow")) {
                            this.unhighlightYellowRow(row);
                        }
                        if (row.data) {
                            row.data.isGrayedOut = true;
                        }
                        var currentCheckDijit;
                        var showFootPrintInput = query("input[name=showFootprint]", row.element);
                        if (showFootPrintInput.length > 0) {
                            currentCheckDijit = registry.getEnclosingWidget(showFootPrintInput[0]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("disabled", true);
                            }
                        }
                        var showThumbnailInput = query("input[name=showThumbNail]", row.element);
                        if (showThumbnailInput.length > 0) {
                            currentCheckDijit = registry.getEnclosingWidget(showThumbnailInput[0]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("disabled", true);
                            }
                        }
                        var addToCartButton = query(".queryResultShoppingCartButton", row.element);
                        if (addToCartButton.legnth > 0) {
                            currentCheckDijit = registry.getEnclosingWidget(addToCartButton[0]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("disabled", true);
                            }
                        }
                        var zoomToIcon = query(".imageResultsZoomToIcon", row.element);
                        if (zoomToIcon.length > 0) {
                            domStyle.set(zoomToIcon[0], "visibility", "hidden");
                        }
                    }
                },
                clearGrayedOutRows: function () {
                    var grayedOutEntries = this.store.query({ isGrayedOut: true});
                    var currentRow;
                    for (var i = 0; i < grayedOutEntries.length; i++) {
                        currentRow = this.row(grayedOutEntries[i]);
                        domClass.remove(currentRow.element, "grayedOutGridRow");
                        var currentCheckDijit;
                        var showFootPrintInput = query("input[name=showFootprint]", currentRow.element);
                        if (showFootPrintInput.length > 0) {
                            currentCheckDijit = registry.getEnclosingWidget(showFootPrintInput[0]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("disabled", false);
                            }
                        }
                        var showThumbnailInput = query("input[name=showThumbNail]", currentRow.element);
                        if (showThumbnailInput.length > 0) {
                            currentCheckDijit = registry.getEnclosingWidget(showThumbnailInput[0]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("disabled", false);
                            }
                        }
                        var addToCartButton = query(".queryResultShoppingCartButton", currentRow.element);
                        if (addToCartButton.length > 0) {
                            currentCheckDijit = registry.getEnclosingWidget(addToCartButton[0]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("disabled", false);
                            }
                        }
                        var zoomToIcon = query(".imageResultsZoomToIcon", currentRow.element);
                        if (zoomToIcon.length > 0) {
                            domStyle.set(zoomToIcon[0], "visibility", "visible");
                        }
                        currentRow.data.isGrayedOut = false;
                    }
                },
                highlightRowYellow: function (row) {
                    if (row && row.element) {
                        domClass.add(row.element, "yellowGridRow");
                    }
                },
                unhighlightYellowRow: function (row) {
                    if (row && row.element) {
                        domClass.remove(row.element, "yellowGridRow");
                    }
                },
                disableThumbnailToggle: function () {
                    var showFootPrintInputs = query("input[name=showThumbNail]", this.domNode);
                    for (var i = 0; i < showFootPrintInputs.length; i++) {
                        var currentCheckDijit = registry.getEnclosingWidget(showFootPrintInputs[i]);
                        if (currentCheckDijit) {
                            currentCheckDijit.set("disabled", true);
                        }
                    }
                },
                enableThumbnailToggle: function () {
                    var showFootPrintInputs = query("input[name=showThumbNail]", this.domNode);
                    for (var i = 0; i < showFootPrintInputs.length; i++) {
                        var currentCheckDijit = registry.getEnclosingWidget(showFootPrintInputs[i]);
                        if (currentCheckDijit) {
                            currentCheckDijit.set("disabled", false);
                        }
                    }
                },
                toggleAllFootprints: function (checked) {
                    var currentCheckDijit;
                    var items = this.store.query({ isFiltered: false});
                    var i;
                    for (i = 0; i < items.length; i++) {
                        items[i].showFootprint = checked;
                        var row = this.row(items[i]);
                        var showFootPrintInput = query("input[name=showFootprint]", row.element);
                        if (showFootPrintInput.length > 0) {
                            currentCheckDijit = registry.getEnclosingWidget(showFootPrintInput[0]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("checked", checked);
                            }
                        }
                    }
                    var queryLayerControllerItemsArray = IMAGERY_UTILS.sortItemsIntoQueryControllerArray(items);
                    var currentQueryLayerController;
                    for (i = 0; i < queryLayerControllerItemsArray.length; i++) {
                        currentQueryLayerController = queryLayerControllerItemsArray[i].queryController;
                        if (checked) {
                            currentQueryLayerController.showFootprints(queryLayerControllerItemsArray[i].items);
                        }
                        else {
                            currentQueryLayerController.hideFootprints();
                        }
                    }
                },
                toggleAllThumbnails: function (checked) {
                    var currentCheckDijit;
                    var items = this.store.query({ isFiltered: false});
                    if (items.length > 0) {
                        for (var i = 0; i < items.length; i++) {
                            items[i].showThumbNail = checked;
                            //update the checkbox
                            var row = this.row(items[i]);
                            var showThumbnailInput = query("input[name=showThumbNail]", row.element);
                            currentCheckDijit = registry.getEnclosingWidget(showThumbnailInput[0]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("checked", checked);
                            }
                        }
                    }
                },
                expand: function () {
                    domStyle.set(this.domNode, "height", this.expandedGridHeight);
                },
                shrink: function () {
                    domStyle.set(this.domNode, "height", this.gridHeight);
                }
            });
    });