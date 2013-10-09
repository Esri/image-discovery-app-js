define([
    "dojo/_base/declare",
//    "xstyle/css!./theme/ImageFilterWidgetTheme.css",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/_base/array"
],
 //   function (declare, theme,lang, topic, array) {
    function (declare, lang, topic, array) {
        return declare(
            [],
            {
                activeFilterFunctions: [],
                constructor: function () {
                    this._initListeners();
                    this.processFilterFunctionsAgainstItemCallback = lang.hitch(this, this.processFilterFunctionsAgainstItem);
                },
                _initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.ADD_FILTER_FUNCTION, lang.hitch(this, this.addFilterFunction));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.REMOVE_FILTER_FUNCTION, lang.hitch(this, this.removeFilterFunction));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.RELOAD_FILTER_FUNCTION, lang.hitch(this, this.reloadFilterFunction));
                },
                //this function attempts removal and then adds the filter function to the array. if it doesn't already exist it is just added
                reloadFilterFunction: function (filterFunction) {
                    //remove it and then add it again to fire the change. block the reload on remove
                    this._removeFilterFunction(filterFunction, false);
                    this.addFilterFunction(filterFunction);
                },
                publishFilterReload: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.SET, this.processFilterFunctionsAgainstItemCallback);

                },
                addFilterFunction: function (filterFunction) {
                    if (filterFunction == null || !lang.isFunction(filterFunction)) {
                        return;
                    }
                    if (array.indexOf(this.activeFilterFunctions, filterFunction) < 0) {
                        this.activeFilterFunctions.push(filterFunction);
                        this.publishFilterReload();
                    }
                },
                removeFilterFunction: function (filterFunction) {
                    this._removeFilterFunction(filterFunction, true);
                },
                _removeFilterFunction: function (filterFunction, publishReload) {
                    if (publishReload == null) {
                        publishReload = true;
                    }
                    var idx = array.indexOf(this.activeFilterFunctions, filterFunction);
                    if (idx > -1) {
                        this.activeFilterFunctions.splice(idx, 1);
                        if (publishReload) {
                            this.publishFilterReload();
                        }
                    }
                    else {
                    }
                },
                processFilterFunctionsAgainstItem: function (item) {
                    for (var i = 0; i < this.activeFilterFunctions.length; i++) {
                        if (!this.activeFilterFunctions[i](item)) {
                            return false;
                        }
                    }
                    return true;
                }
            });
    });