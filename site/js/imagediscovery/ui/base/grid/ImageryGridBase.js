define([
    "dojo/_base/declare",
    "xstyle/css!./theme/baseGridTheme.css",
    "dgrid/Grid",
    "./Pagination",
    "dgrid/extensions/ColumnHider",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/query",
    "dijit/registry"
],
    //base class for imagery grid. The grid is extended quite a bit so it was broken into two classes for size.
    function (declare, theme, Grid, Pagination, ColumnHider, domClass, domStyle, lang, query, registry) {
        return declare(
            [Grid, Pagination, ColumnHider],
            {
                pagingLinks: false,
                pagingTextBox: true,
                firstLastArrows: true,
                minRowsPerPage: 100,
                rowsPerPage: 100,
                pageSizeOptions: [100,200,300,400,500],
                //when true, the thumbnail checkboxes are disabled
                thumbnailToggleDisabled: false,
                //height of the grid
                gridHeight: "160px",
                //expanded height of the grid
                expandedGridHeight: "350px",
                /**
                 * renders a row in the grid
                 * @param row row to render
                 * @return {*}
                 */
                renderRow: function (row) {
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
                /**
                 * sets grayed out rows based on passed function
                 * @param isDisabledFunction takes in an item, returns to if the row it to be grayed out
                 */
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
                /**
                 * grays out a row
                 * @param row row to gray out
                 */
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
                        var zoomToIcon = query(".globeGoTo", row.element);
                        if (zoomToIcon.length > 0) {
                            domStyle.set(zoomToIcon[0], "visibility", "hidden");
                        }
                        var magnifyIcon = query(".magnifyingGlass", row.element);
                        if (magnifyIcon.length > 0) {
                            domStyle.set(magnifyIcon[0], "visibility", "hidden");
                        }
                    }
                },
                /**
                 * clear all grayed out rows in the grid. the rows are still in the grid
                 */
                clearGrayedOutRows: function () {
                    var grayedOutEntries = this.store.query({ isGrayedOut: true});
                    var currentRow;
                    for (var i = 0; i < grayedOutEntries.length; i++) {
                        currentRow = this.row(grayedOutEntries[i]);
                        domClass.remove(currentRow.element, "grayedOutGridRow");
                        var currentCheckDijit;
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
                        var zoomToIcon = query(".globeGoTo", currentRow.element);
                        if (zoomToIcon.length > 0) {
                            domStyle.set(zoomToIcon[0], "visibility", "visible");
                        }

                        var magnifyIcon = query(".magnifyingGlass", currentRow.element);
                        if (magnifyIcon.length > 0) {
                            domStyle.set(magnifyIcon[0], "visibility", "visible");
                        }
                        currentRow.data.isGrayedOut = false;
                    }
                },
                /**
                 * highlights a row yellow
                 * @param row row to highlight yellow
                 */
                highlightRowYellow: function (row) {
                    if (row && row.element) {
                        domClass.add(row.element, "yellowGridRow");
                    }
                },
                /**
                 * unhighlights a row in the grid
                 * @param row row to unhighlight yellow
                 */
                unhighlightYellowRow: function (row) {
                    if (row && row.element) {
                        domClass.remove(row.element, "yellowGridRow");
                    }
                },
                /**
                 * disables all thumbnail checkboxes in the grid
                 */
                disableThumbnailToggle: function () {
                    if (!this.thumbnailToggleDisabled) {
                        var showFootPrintInputs = query("input[name=showThumbNail]", this.domNode);
                        for (var i = 0; i < showFootPrintInputs.length; i++) {
                            var currentCheckDijit = registry.getEnclosingWidget(showFootPrintInputs[i]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("disabled", true);
                            }
                        }
                        this.thumbnailToggleDisabled = true;
                    }
                },
                /**
                 * enables all thumbnail checkboxes in the grid
                 */
                enableThumbnailToggle: function () {
                    if (this.thumbnailToggleDisabled) {
                        var showFootPrintInputs = query("input[name=showThumbNail]", this.domNode);
                        for (var i = 0; i < showFootPrintInputs.length; i++) {
                            var currentCheckDijit = registry.getEnclosingWidget(showFootPrintInputs[i]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("disabled", false);
                            }
                        }
                        this.thumbnailToggleDisabled = false;
                    }
                },
                /**
                 * toggles all thumbnail checkboxes in the grid
                 * @param checked boolean to use for checkbox state
                 */
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
                /**
                 * expands the grid
                 */
                expand: function () {
                    domStyle.set(this.domNode, "height", this.expandedGridHeight);
                },
                /**
                 * shrinks the grid
                 */
                shrink: function () {
                    domStyle.set(this.domNode, "height", this.gridHeight);
                }
            });
    });