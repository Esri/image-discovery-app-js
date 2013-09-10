define([
    "dojo/_base/declare",
    "dojo/text!./template/AddedCatalogsListTemplate.html",
    "xstyle/css!./theme/AddedCatalogsListTheme.css",
    "dojo/_base/lang",
    "esriviewer/ui/base/UITemplatedWidget",
    "./model/AddedCatalogsViewModel"
],
    function (declare, template, theme, lang, UITemplatedWidget, AddedCatalogsViewModel) {
        return declare(
            [UITemplatedWidget],
            {
                bindingsApplied: false,
                templateString: template,
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new AddedCatalogsViewModel();
                    this.viewModel.on(this.viewModel.ADD_PERSISTED_CATALOG, lang.hitch(this, this.handleAddPersistedCatalog));
                    this.viewModel.on(this.viewModel.REMOVE_PERSISTED_CATALOG, lang.hitch(this, this.handleRemovePersistedCatalog));
                },
                handleRemovePersistedCatalog: function (persistedCatalogObject) {
                    if (persistedCatalogObject && lang.isObject(persistedCatalogObject)) {
                        this.onRemovePersistedCatalog(persistedCatalogObject);
                    }
                },
                handleAddPersistedCatalog: function (persistedCatalogObject) {
                    if (persistedCatalogObject && lang.isObject(persistedCatalogObject)) {
                        this.onAddPersistedCatalog(persistedCatalogObject);
                    }
                },
                addExistingCatalogItems: function (catalogs) {
                    for (var i = 0; i < catalogs.length; i++) {
                        this.viewModel.addedCatalogs.push(catalogs[i]);
                    }
                    this.applyBindings();
                },
                addPersistedCatalog: function (catalog) {
                    this.viewModel.addedCatalogs.push(catalog);
                },
                /*Events*/
                onAddPersistedCatalog: function (persistedCatalogObject) {

                },
                onRemovePersistedCatalog: function (persistedCatalogObject) {

                },
                applyBindings: function () {
                    if (!this.bindingsApplied) {
                        this.bindingsApplied = true;
                        ko.applyBindings(this.viewModel, this.domNode);
                    }
                }
            });
    });
