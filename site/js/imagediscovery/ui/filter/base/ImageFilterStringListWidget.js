define([
    "dojo/_base/declare",
    "dojo/on",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/dom-attr",
    "./BaseImageryFilterWidget"
],
    function (declare, on, lang, domConstruct, domClass,  domAttr, BaseImageryFilterWidget) {
        return declare(
            [BaseImageryFilterWidget],
            {
                selectedClass: "imageFilterStringListLblSelected",
                unselectedClass: "imageFilterStringListLblUnselected",
                nullDisplayValue: "*Empty*",
                currentEnabledStringCount: 0,
                stringEntryCount: 0,
                constructor: function () {
                    this.selectedValuesLookup = {};
                    this.stringListEntries = [];
                },
                _createView: function () {
                    this.stringListEntries = [];
                    this.stringElementCache = [];
                    this.wrapperDiv = domConstruct.create("div", {className: "imageFilterStringListWrapperContainer"});
                    var hideAllContainer = domConstruct.create("div", {className: "imageFilterStringListHideAll", innerHTML: "Exclude All"});
                    on(hideAllContainer,"click",lang.hitch(this,this.hideAll));
                    domConstruct.place(hideAllContainer, this.wrapperDiv);
                    this.createStringList();
                    return this.wrapperDiv;
                },
                hideAll: function(){
                    for (var i = 0; i < this.stringElementCache.length; i++) {
                        this.disableStringElement(this.stringElementCache[i]);
                    }
                    this.applyFilterFunctionChange();
                },
                createStringList: function () {
                    this.stringElementCache = [];
                    if (this.stringListContainer != null) {
                        //this is a refresh
                        //clear the connects
                        this.clearConnects();
                        this.selectedValuesLookup = {};
                        domConstruct.destroy(this.stringListContainer);
                    }
                    this.stringListContainer = domConstruct.create("div", {className: "imageFilterStringListContainer"});
                    var currentString;
                    if (this.stringListEntries && lang.isArray(this.stringListEntries)) {
                        for (var i = 0; i < this.stringListEntries.length; i++) {
                            var currentStringContainer = domConstruct.create("div", {className: "imageFilterStringListEntryContainer"});
                            domConstruct.place(currentStringContainer, this.stringListContainer);
                            if (this.stringListEntries[i] == null) {
                                continue;
                            }
                            currentString = this.stringListEntries[i].toString();
                            currentString = currentString != "" ? currentString : this.nullDisplayValue;

                            var currentStringLbl = domConstruct.create("span", {title: "Click to toggle", className: "imageFilterStringListLbl " + this.selectedClass, innerHTML: currentString});
                            this.stringElementCache.push(currentStringLbl);
                            domConstruct.place(currentStringLbl, currentStringContainer);


                            this.connects.push(on(currentStringContainer, "click", lang.hitch(this, this.handleStringElementToggle, currentStringLbl)));
                            this.selectedValuesLookup[currentString] = currentString;
                            this.currentEnabledStringCount++;
                            this.stringEntryCount++;
                        }
                    }
                    domConstruct.place(this.stringListContainer, this.wrapperDiv);
                    this.stringListCreated();

                },
                stringListCreated: function () {
                    this.clearFilterFunction();
                },
                isDefaultState: function () {
                    return this.stringEntryCount == this.currentEnabledStringCount;
                },
                handleStringElementToggle: function (currentStringLblElement) {
                    var stringValue = domAttr.get(currentStringLblElement, "innerHTML");
                    if (domClass.contains(currentStringLblElement, this.selectedClass)) {
                        this.disableStringElement(currentStringLblElement);
                    }
                    else {
                        this.enableStringElement(currentStringLblElement);
                    }
                    if (this.isDefaultState()) {
                        this.clearFilterFunction();
                    }
                    else {
                        this.applyFilterFunctionChange();
                    }


                },
                enableStringElement: function (element) {
                    var stringValue = domAttr.get(element, "innerHTML");
                    if (this.selectedValuesLookup[stringValue] == null) {
                        domClass.add(element, this.selectedClass);
                        domClass.remove(element, this.unselectedClass);
                        domClass.remove(element, this.unselectedClass);
                        this.selectedValuesLookup[stringValue] = stringValue;
                        this.currentEnabledStringCount++;
                    }
                },
                disableStringElement: function (element) {
                    var stringValue = domAttr.get(element, "innerHTML");
                    if (this.selectedValuesLookup[stringValue] != null) {
                        domClass.remove(element, this.selectedClass);
                        domClass.add(element, this.unselectedClass);
                        delete this.selectedValuesLookup[stringValue];
                        this.currentEnabledStringCount--;
                    }
                },
                filterFunction: function (item) {
                    var val = item[this.queryField];
                    if (val === "" || val === null) {
                        val = this.nullDisplayValue;
                    }
                    return this.selectedValuesLookup[val] != null;
                },
                reset: function () {
                    for (var i = 0; i < this.stringElementCache.length; i++) {
                        this.enableStringElement(this.stringElementCache[i]);
                    }
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