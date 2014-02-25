define([
    "dojo/_base/declare",
    "dgrid/extensions/Pagination",
    "dojo/_base/lang"
],
    function (declare, Pagination, lang) {
        return declare(
            [Pagination],
            {
                ignorePagingEvent: false,
                constructor: function () {
                    this.onPageChangedHitched = lang.hitch(this, function () {
                        this._onPageChanged();
                    });
                },
                gotoPage: function (page, focusLink) {
                    var def = this.inherited(arguments);
                    if (!this.ignorePagingEvent) {
                        def.then(this.onPageChangedHitched);
                    }
                    else{
                    }
                    return def;
                },
                _onPageChanged: function () {
                    this.onPageChanged();
                },
                onPageChanged: function () {

                },
                enablePaginationListener: function () {
                    this.ignorePagingEvent = false;
                },
                disablePaginationListener: function () {
                    this.ignorePagingEvent = true;
                }


            });
    });
        