define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageryFilterWidgetTemplate.html",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/_base/connect",
    "esriviewer/ui/base/UITemplatedWidget"
],
    //base widget that is used by all filters
    function (declare, template, domConstruct,  domStyle,  lang, con, UITemplatedWidget) {
        return declare(
            [UITemplatedWidget],
            {
                //set this to the image service
                queryField: "queryField",
                enabled: true,
                templateString: template,
                title: "Query Widget",
                visible: true,

                constructor: function (params) {
                    lang.mixin(this, params || {});
                },

                postCreate: function () {
                    this.inherited(arguments);
                    this.filterFunctionCallback = lang.hitch(this, this.filterFunction);
                    this.createQueryContent();
                    if (this.enabled) {
                        this.enableQuery();
                    }
                    else {
                        this.disableQuery();

                    }
                },
                createQueryContent: function () {
                    var contents = this._createView();
                    if (contents == null) {
                        return;
                    }
                    domConstruct.place(contents, this.imageQueryWidgetContents);
                },
                _createView: function () {
                    //override this
                },
                getQueryArray: function () {
                    return "";
                },
                hide: function () {
                    domStyle.set(this.domNode, "display", "none");
                    this.visible = false;
                    this.onFilterHidden();
                },
                show: function () {
                    domStyle.set(this.domNode, "display", "block");
                    this.visible = true;
                    this.onFilterDisplayed();
                },
                reset: function () {
                    this.clearFilterFunction();
                },
                disableQuery: function () {
                    this.enabled = false;
                    this.onClearFilterFunction();

                },
                enableQueryIfVisible: function () {
                    if (this.visible && !this.enabled) {
                        this.enableQuery();
                    }
                },
                enableQuery: function () {
                    this.enabled = true;
                    if (this.isDefaultState()) {
                        this.clearFilterFunction();
                    }
                    else {
                        this.applyFilterFunctionChange();
                    }
                },
                applyFilterFunctionChange: function () {
                    if (this.enabled) {
                        this.onApplyFilterFunction(this.filterFunctionCallback);
                    }
                },
                updateRangeFromVisible: function () {

                },
                clearFilterFunction: function () {
                    this.onClearFilterFunction();
                },
                filterFunction: function (item) {
                    return true;
                },
                onClearFilterFunction: function () {

                },
                onApplyFilterFunction: function (filterFxn) {
                },
                onFilterHidden: function () {
                },
                onFilterDisplayed: function () {
                },
                isDefaultState: function () {
                    return false;
                }

            });

    });