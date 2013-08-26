define([
    "dojo/_base/declare",
    "dojo/Evented"
],
    function (declare, Evented) {
        return declare(
            [Evented],
            {
                LOAD_CATALOG_URL: "loadCatalogUrl",
                ADD_CATALOG: "addCatalog",
                ignoreCatalogFields: {
                    Shape: "Shape",
                    Shape_Length: "Shape_Length",
                    Shape_Area: "Shape_Area"
                },
                constructor: function () {
                    var self = this;
                    this.showSavedCatalogsTab = ko.observable(true);
                    this.addCatalogVisible = ko.observable(true);
                    this.savedCatalogsVisible = ko.observable(false);
                    this.catalogName = ko.observable("Catalog");
                    this.catalogUrlInputValue = ko.observable("http://imagery.arcgisonline.com/arcgis/rest/services/LandsatGLS/LandsatMaster/ImageServer");
                    this.searchFields = ko.observableArray();
                    this.checkForCatalogEnter = function (model, event) {
                        if (VIEWER_UTILS.isEnterKey(event)) {
                            self.emit(self.LOAD_CATALOG_URL);
                        }
                    };
                    this.hasSearchFields = ko.computed(function () {
                        return self.searchFields().length > 0;
                    });
                },
                handleLoadFromCatalogUrl: function () {
                    this.emit(this.LOAD_CATALOG_URL);
                },
                initializeService: function () {
                    this.emit(this.ADD_CATALOG);
                },
                clearSearchFields: function () {
                    this.searchFields.removeAll();
                },
                showSavedCatalogs: function () {
                    this.addCatalogVisible(false);
                    this.savedCatalogsVisible(true);
                },
                showAddCatalog: function () {
                    this.addCatalogVisible(true);
                    this.savedCatalogsVisible(false);
                },
                isIgnoreField: function (field) {
                    return this.ignoreCatalogFields[field] != null;
                }
            });
    });