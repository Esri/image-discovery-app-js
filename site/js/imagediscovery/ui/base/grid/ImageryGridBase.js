define([
    "dojo/_base/declare",
    "xstyle/css!./theme/baseGridTheme.css",
    "dgrid/OnDemandGrid",
    "dgrid/extensions/ColumnHider",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/query",
    "dijit/registry"
],
    //base class for imagery grid. The grid is extended quite a bit so it was broken into two classes for size.
    function (declare, theme, OnDemandGrid, ColumnHider, domClass, domStyle, lang, query, registry) {
        return declare(
            [OnDemandGrid, ColumnHider],
            {
                thumnailToggleDisabled: false,
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
                    if (!this.thumnailToggleDisabled) {
                        var showFootPrintInputs = query("input[name=showThumbNail]", this.domNode);
                        for (var i = 0; i < showFootPrintInputs.length; i++) {
                            var currentCheckDijit = registry.getEnclosingWidget(showFootPrintInputs[i]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("disabled", true);
                            }
                        }
                        this.thumnailToggleDisabled = true;
                    }
                },
                enableThumbnailToggle: function () {
                    if (this.thumnailToggleDisabled) {
                        var showFootPrintInputs = query("input[name=showThumbNail]", this.domNode);
                        for (var i = 0; i < showFootPrintInputs.length; i++) {
                            var currentCheckDijit = registry.getEnclosingWidget(showFootPrintInputs[i]);
                            if (currentCheckDijit) {
                                currentCheckDijit.set("disabled", false);
                            }
                        }
                        this.thumnailToggleDisabled = false;
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