define([
    "dojo/_base/declare",
    "dojo/dom-attr",
    "dojo/_base/lang",
    "dojo/_base/array"
],
    function (declare, domAttr, lang, array) {
        return declare(
            [],
            {
                LOOKUP_OBSERVABLE_ENTRY: "lookupObservableEntry",

                constructor: function () {
                    this.currentSelectedRasterFunctionWidget = null;
                    this._rasterFunctionOptionsCache = [];
                    this.rasterFunctionSelectLabel = ko.observable("Renderer:");
                    this.rasterFunctions = ko.observableArray([]);
                    this.selectedRasterFunction = ko.observable(null);
                    this.internalLookupFunctionObservables = {};
                    this.selectedRasterFunction.subscribe(lang.hitch(this, this.handleRasterFunctionChanged));
                },
                handleRasterFunctionChanged: function (value) {
                    var selectedIndex = this.rasterFunctions.indexOf(value);
                    var selectedLookupObservableId;
                    if (selectedIndex > -1) {
                        if (this.currentSelectedRasterFunctionWidget) {
                            this.currentSelectedRasterFunctionWidget.hide();
                        }
                        var selectedRasterFunctionWidget = this.rasterFunctions()[selectedIndex];
                        this.currentSelectedRasterFunctionWidget = selectedRasterFunctionWidget.widget;
                        this.currentSelectedRasterFunctionWidget.show();
                        selectedLookupObservableId = selectedRasterFunctionWidget[this.LOOKUP_OBSERVABLE_ENTRY];
                    }
                    var currentObservable;
                    for (var key in this.internalLookupFunctionObservables) {
                        currentObservable = this.internalLookupFunctionObservables[key];
                        if (key != selectedLookupObservableId) {
                            currentObservable(false);
                        }
                        else {
                            currentObservable(true);
                        }
                    }
                },
                addRasterFunction: function (rasterFunctionObject) {
                    this._addRasterFunction(rasterFunctionObject);
                    this.addRasterFunctionSelectOption(rasterFunctionObject);
                },
                _addRasterFunction: function (rasterFunctionObject) {
                    if (rasterFunctionObject == null || rasterFunctionObject.label == null || rasterFunctionObject.widget == null || rasterFunctionObject.widget.domNode == null) {
                        return;
                    }
                    //strip whitespace
                    var internalVar = "rst_" + (rasterFunctionObject.label).replace(/\s+/g, "_");
                    //dots not allowed
                    internalVar = internalVar.replace(/[.-]/g, "_");
                    //add data bind to domNode
                    var widget = rasterFunctionObject.widget;
                    var widgetDomNode = widget.domNode;
                    domAttr.set(widgetDomNode, "data-bind", "visible: " + internalVar);

                    var observableForWidget = ko.observable(true);
                    this[internalVar] = observableForWidget;

                    this.internalLookupFunctionObservables[internalVar] = observableForWidget;
                    rasterFunctionObject[this.LOOKUP_OBSERVABLE_ENTRY] = internalVar;
                    this._rasterFunctionOptionsCache.push(rasterFunctionObject);
                    //  this.rasterFunctions.push(rasterFunctionObject);
                },
                addRasterFunctionSelectOption: function (rasterFunctionObject) {
                    var internalFunctionArrayLookupIdx = array.indexOf(this._rasterFunctionOptionsCache, rasterFunctionObject);
                    //make sure its in the internal functions array but not in the current displayed raster functions
                    if (internalFunctionArrayLookupIdx > -1) {
                        var rasterFunctionsArrayIdx = this.rasterFunctions.indexOf(this._rasterFunctionOptionsCache[internalFunctionArrayLookupIdx]);
                        if (rasterFunctionsArrayIdx < 0) {
                            this.rasterFunctions.push(this._rasterFunctionOptionsCache[internalFunctionArrayLookupIdx]);
                        }
                    }
                },
                removeRasterFunctionSelectOption: function (rasterFunctionObject) {
                    var idx = this.rasterFunctions.indexOf(rasterFunctionObject);
                    if (idx > -1) {
                        this.rasterFunctions.remove(rasterFunctionObject);
                    }
                }
            });

    })
;