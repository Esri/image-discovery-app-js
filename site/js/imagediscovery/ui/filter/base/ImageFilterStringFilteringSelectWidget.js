//**NOT COMPLETE***

define([
    "dojo/_base/declare",
    "dojo/on",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-attr",
    "./BaseImageryFilterWidget",
    "dijit/form/FilteringSelect",
    "dojo/store/Memory"
],
    function (declare, on, lang, domConstruct, domClass, domStyle, domAttr, BaseImageryFilterWidget, FilteringSelect, Memory) {
        return declare(
            [BaseImageryFilterWidget],
            {
                selectedClass: "imageFilterStringListLblSelected",
                unselectedClass: "imageFilterStringListLblUnselected",
                nullDisplayValue: "*Empty*",
                currentEnabledStringCount: 0,
                maxSelectHeight: 200,
                stringEntryCount: 0,
                constructor: function () {
                    this.selectedValuesLookup = {};
                    this.stringListEntries = [];
                },
                _createView: function () {
                    this.stringListEntries = [];
                    this.stringElementCache = [];


                    this.wrapperDiv = domConstruct.create("div", {className: "imageFilterStringListWrapperContainer"});
                    this.addEntryIcon = domConstruct.create("div", {className: "commonIcons16 add imageFilterStringListAddIcon"});
                    domConstruct.place(this.addEntryIcon, this.wrapperDiv);
                    this._createFilteringSelect();
                    return this.wrapperDiv;
                },
                _createFilteringSelect: function () {
                    this.stringFilteringSelect = new FilteringSelect({
                        required: false,
                        searchAttr: "name",
                        store: new Memory({
                            data: []
                        }),
                        maxHeight: this.maxSelectHeight
                    });
                    domConstruct.place(this.stringFilteringSelect.domNode, this.wrapperDiv);
                },
                createStringList: function () {
                    if (this.stringFilteringSelect && this.stringListEntries && lang.isArray(this.stringListEntries)) {
                        var currentString;
                        var stringStoreEntries = [];
                        for (var i = 0; i < this.stringListEntries.length; i++) {
                            if (this.stringListEntries[i] == null) {
                                continue;
                            }
                            currentString = this.stringListEntries[i].toString();
                            currentString = currentString != "" ? currentString : this.nullDisplayValue;
                            stringStoreEntries.push({name: currentString, id: VIEWER_UTILS.generateUUID()});
                        }
                    }
                    var store = new Memory({
                        data: stringStoreEntries
                    });
                    this.stringFilteringSelect.set("store", store);
                    this.stringListCreated();
                },
                stringListCreated: function () {
                    this.clearFilterFunction();
                },
                isDefaultState: function () {
                    return this.stringEntryCount == this.currentEnabledStringCount;
                },
                filterFunction: function (item) {
                    var val = item[this.queryField];
                    if (val === "" || val === null) {
                        val = this.nullDisplayValue;
                    }
                    return this.selectedValuesLookup[val] != null;
                },
                reset: function () {
                    this.clearFilterFunction();
                },
                updateRangeFromVisible: function () {

                },
                getQueryArray: function () {
                    var where = [];
                    if (this.enabled) {
                        var temparr = [];
                        var currString;
                        for (var key in this.selectedValuesLookup) {
                            currString = this.selectedValuesLookup[key];
                            currString = currString === this.nullDisplayValue ? "" : currString;
                            temparr.push(this.queryField + " = \'" + this.selectedValuesLookup[key] + "\'");
                        }
                        if (temparr.length > 0) {
                            where.push(temparr.length > 1 ? temparr.join(" OR ") : temparr.join(""));
                        }
                    }
                    return where;
                }
            });
    });