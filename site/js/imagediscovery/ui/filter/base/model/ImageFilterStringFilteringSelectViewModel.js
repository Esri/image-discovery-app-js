define([
    "dojo/_base/declare",
    "dojo/Evented",
    "dojo/_base/lang"
],
    function (declare, Evented, lang) {
        return declare(
            [Evented],
            {
                INCLUDE: "include",
                EXCLUDE: "exclude",
                CLEAR_FILTER: "clearFilter",
                APPLY_FILTER: "applyFilter",
                constructor: function () {
                    var self = this;
                    this.includeStrings = ko.observableArray();
                    this.stringFilterMode = ko.observable(this.INCLUDE);
                    this.stringFilterMode.subscribe(lang.hitch(this, this._handleStringFilterModeChanged));
                    this.removeIncludedItem = function (item) {
                        self.includeStrings.remove(item);
                        var includeLength = self.includeStrings().length;
                        if (includeLength == 0) {
                            self.emit(self.CLEAR_FILTER);
                            return;
                        }
                        self.emit(self.APPLY_FILTER);
                    };
                    this.hasIncludeEntry = ko.computed(function () {
                        return self.includeStrings().length > 0;
                    });
                    this.stringFilterModeLabel = ko.computed(function () {
                        return  self.stringFilterMode() == self.INCLUDE ? "Include:" : "Exclude:"
                    });
                },
                /**
                 * @description handles change of string filter mode
                 * @private
                 */
                _handleStringFilterModeChanged: function () {
                    var includeLength = this.includeStrings().length;
                    if (includeLength > 0) {
                        this.emit(this.APPLY_FILTER);
                    }
                },
                getMode: function(){
                    return this.stringFilterMode();
                }

            });
    });