define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageFilterStringFilteringSelectWidgetTemplate.html",
    //   "xstyle/css!./theme/ImageFilterStringFilteringSelectTheme.css",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "./BaseImageryFilterWidget",
    "dijit/form/FilteringSelect",
    "dojo/store/Memory",
    "./model/ImageFilterStringFilteringSelectViewModel"
],
    //   function (declare, template, cssTheme, lang, domConstruct, BaseImageryFilterWidget, FilteringSelect, Memory, ImageFilterStringFilteringSelectViewModel) {
    function (declare, template, lang, domConstruct, BaseImageryFilterWidget, FilteringSelect, Memory, ImageFilterStringFilteringSelectViewModel) {
        return declare(
            [BaseImageryFilterWidget],
            {
                templateString: template,
                selectedClass: "imageFilterStringListLblSelected",
                unselectedClass: "imageFilterStringListLblUnselected",
                nullDisplayValue: "*Empty*",
                currentEnabledStringCount: 0,
                maxSelectHeight: 200,
                stringEntryCount: 0,
                constructor: function () {
                    this.stringListEntries = [];
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.stringListEntries = [];
                    this.viewModel = new ImageFilterStringFilteringSelectViewModel();
                    this.viewModel.on(this.viewModel.CLEAR_FILTER, lang.hitch(this, this.clearFilterFunction));
                    this.viewModel.on(this.viewModel.APPLY_FILTER, lang.hitch(this, this.handleViewModelApplyFilter));
                    ko.applyBindings(this.viewModel, this.domNode);
                    this._createFilteringSelect();
                },
                _createFilteringSelect: function () {
                    this.stringFilteringSelect = new FilteringSelect({
                        required: false,
                        searchAttr: "id",
                        store: new Memory({
                            data: []
                        }),
                        maxHeight: this.maxSelectHeight
                    });
                    domConstruct.place(this.stringFilteringSelect.domNode, this.stringFilteringSelectContainer);
                },
                handleViewModelApplyFilter: function (obj) {
                    this.applyFilterFunctionChange();
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
                            stringStoreEntries.push({ id: currentString});
                        }
                    }
                    var store = new Memory({
                        data: stringStoreEntries
                    });
                    this.stringFilteringSelect.set("store", store);
                    this.stringListCreated();
                },
                addEntryToIncludeList: function () {
                    var currentValue = this.stringFilteringSelect.get("value");
                    if (currentValue && currentValue != "" && this.viewModel.includeStrings.indexOf(currentValue) < 0) {
                        this.viewModel.includeStrings.push(currentValue);
                        this.applyFilterFunctionChange();
                    }
                },
                stringListCreated: function () {
                    this.clearFilterFunction();
                },
                isDefaultState: function () {
                    return !this.viewModel || this.viewModel.includeStrings().length == 0;
                },
                filterFunction: function (item) {
                    var val = item[this.queryField];
                    if (val === "" || val === null) {
                        val = this.nullDisplayValue;
                    }
                    var mode = this.viewModel.getMode();
                    if (mode == this.viewModel.INCLUDE) {
                        return this.viewModel.includeStrings.indexOf(val) > -1;
                    }
                    else {
                        return this.viewModel.includeStrings.indexOf(val) < 0;
                    }
                },
                reset: function () {
                    this.viewModel.includeStrings.removeAll();
                    this.clearFilterFunction();
                },
                updateRangeFromVisible: function () {

                },
                getQueryArray: function () {
                    var where = [];
                    if (this.enabled) {
                        var temparr = [];
                        var currString;
                        var includeStrings = this.viewModel.includeStrings();
                        var mode = this.viewModel.getMode();
                        var operator;
                        if (mode == this.viewModel.INCLUDE) {
                            operator = " = ";
                        }
                        else {
                            //exclude
                            operator = " <> ";
                        }
                        for (var i = 0; i < includeStrings.length; i++) {
                            currString = includeStrings[i];
                            currString = currString === this.nullDisplayValue ? "" : currString;
                            temparr.push(this.queryField + operator + "\'" + currString + "\'");
                        }
                        if (temparr.length > 0) {
                            where.push(temparr.length > 1 ? temparr.join(" OR ") : temparr.join(""));
                        }
                    }
                    return where;
                }
            });
    });