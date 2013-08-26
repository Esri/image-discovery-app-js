define([
    "dojo/_base/declare",
    "dojo/Evented",
    "dojo/_base/lang"
],
    function (declare, Evented, lang) {
        return declare(
            [Evented],
            {
                REMOVE_PERSISTED_CATALOG: "removePersistedCatalog",
                ADD_PERSISTED_CATALOG: "addPersistedCatalog",
                constructor: function () {
                    var self = this;
                    this.addedCatalogs = ko.observableArray();

                    this.removeCatalog = function (catalogItem) {
                        if (catalogItem == null) {
                            return;
                        }
                        self.emit(self.REMOVE_PERSISTED_CATALOG, catalogItem);
                        self.addedCatalogs.remove(catalogItem);
                    };
                    this.addCatalog = function (catalogItem) {
                        if (catalogItem == null) {
                            return;
                        }
                        self.emit(self.ADD_PERSISTED_CATALOG, catalogItem);
                    };
                },
                getCatalogLabel: function (catalogItem) {
                    if (catalogItem && catalogItem.catalog && catalogItem.catalog.imageQueryLayers != null) {
                        if (lang.isArray(catalogItem.catalog.imageQueryLayers) && catalogItem.catalog.imageQueryLayers.length > 0) {
                            return catalogItem.catalog.imageQueryLayers[0].label;
                        }
                    }
                    return "*No Label*";
                }
            });
    });