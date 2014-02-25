define([
    "dojo/_base/declare",
    "dojo/text!./template/AddCatalogTemplate.html",
  //  "xstyle/css!./theme/AddCatalogTheme.css",
    "dojo/topic",
    "dojo/query",
    "dojo/NodeList-traverse",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/_base/lang",
    "esriviewer/ui/base/UITemplatedWidget",
    "./model/AddCatalogViewModel",
    "./base/AddedCatalogsLocalStorageMixin",
    "./base/AddedCatalogsListWidget"
],
   // function (declare, template, theme, topic, query, nodeTraverse, domConstruct, domAttr, lang, UITemplatedWidget, AddCatalogViewModel, AddedCatalogsLocalStorageMixin, AddedCatalogsList) {
    function (declare, template,  topic, query, nodeTraverse, domConstruct, domAttr, lang, UITemplatedWidget, AddCatalogViewModel, AddedCatalogsLocalStorageMixin, AddedCatalogsListWidget) {
        return declare(
            [ UITemplatedWidget, AddedCatalogsLocalStorageMixin],
            {
                templateString: template,
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new AddCatalogViewModel();
                    this.viewModel.on(this.viewModel.LOAD_CATALOG_URL, lang.hitch(this, this.handleLoadCatalogUrl));
                    this.viewModel.on(this.viewModel.ADD_CATALOG, lang.hitch(this, this.handleAddCatalog));
                    if (this.localStoragePersistSupported) {
                        this.viewModel.showSavedCatalogs();
                    }
                    ko.applyBindings(this.viewModel, this.domNode);
                    if (this.localStoragePersistSupported) {
                        this.createPersistedCatalogListWidget();
                    }
                    else {
                        this.viewModel.showSavedCatalogsTab(false);
                    }
                },
                createPersistedCatalogListWidget: function () {
                    if (this.catalogListWidget == null) {
                        this.catalogListWidget = new AddedCatalogsListWidget();
                        this.catalogListWidget.placeAt(this.persistedCatalogsContainer);
                        this.catalogListWidget.on("removePersistedCatalog", lang.hitch(this, this.removePersistedCatalog));
                        this.catalogListWidget.on("addPersistedCatalog", lang.hitch(this, this.deployUserPersistedCatalog));

                        //populate the existing graphics
                        this.catalogListWidget.addExistingCatalogItems(this.persistedUserCatalogs);
                    }
                },
                removePersistedCatalog: function (catalog) {
                    var hasItem = this.deleteUserPersistedCatalog(catalog);
                    if (!hasItem) {
                        this.viewModel.showSavedCatalogsTab(false);
                        this.viewModel.showAddCatalog();
                    }
                },
                deployUserPersistedCatalog: function (catalogObj) {
                    this.onCatalogSet(catalogObj.catalog);
                },
                addPersistedCatalog: function (catalog) {
                    this.catalogListWidget.addPersistedCatalog(catalog);
                    this.persistUserCatalog(catalog);
                    this.viewModel.showSavedCatalogsTab(true);
                },
                handleLoadCatalogUrl: function () {
                    var catUrl = this.viewModel.catalogUrlInputValue();
                    VIEWER_UTILS.getServiceDescription(catUrl, lang.hitch(this, this.handleServiceDescriptionLoaded), lang.hitch(this, this.handleServiceDescLoadError));
                },
                handleServiceDescriptionLoaded: function (serviceDesc) {
                    if (serviceDesc != null && lang.isObject(serviceDesc)) {
                        if (serviceDesc.fields != null && lang.isArray(serviceDesc.fields)) {
                            this.viewModel.searchFields(serviceDesc.fields);
                        }
                    }
                },
                handleServiceDescLoadError: function (err) {

                },
                handleAddCatalog: function () {
                    var searchFields = [];
                    var discoveryFilters = [];
                    var enabledFieldCheckboxes = query(".addCatalogFieldEnabledCheckbox:checked");
                    if (enabledFieldCheckboxes.length == 0) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There are no fields enabled");
                        return;
                    }
                    for (var i = 0; i < enabledFieldCheckboxes.length; i++) {
                        var listItem = enabledFieldCheckboxes[i].parentNode.parentNode.parentNode;
                        var filterCheckbox = query(".addCatalogFieldFilterCheckbox", listItem)[0];
                        var fieldLabel = query(".addCatalogFieldLabelTextInput", listItem)[0];
                        var fieldName = query(".catalogFieldNameHeader", listItem)[0].innerHTML;
                        var hiddenCheckbox = query(".addCatalogFieldHiddenCheckbox", listItem)[0];
                        var discoveryFilterCheckbox = query(".addCatalogFieldDisocveryFilterCheckbox", listItem)[0];

                        var label = domAttr.get(fieldLabel, "value");

                        if (domAttr.get(discoveryFilterCheckbox, "checked")) {
                            discoveryFilters.push({
                                field: fieldName,
                                label: label
                            });
                        }
                        searchFields.push({
                            field: fieldName,
                            label: label,
                            filter: {
                                enabled: domAttr.get(filterCheckbox, "checked")
                            },
                            gridOptions: {
                                hiddenOnDisplay: domAttr.get(hiddenCheckbox, "checked")
                            }
                        });
                    }
                    var configurationEntry = {
                        imageQueryLayers: [
                            {
                                url: this.viewModel.catalogUrlInputValue(),
                                label: this.viewModel.catalogName(),
                                queryWhereClauseAppend: "Category = 1"
                            }
                        ],
                        imageQueryResultDisplayFields: searchFields,
                        imageDiscoveryQueryFields: discoveryFilters
                    };
                    this.addPersistedCatalog(configurationEntry);
                    this.onCatalogSet(configurationEntry);
                },
                onCatalogSet: function (configurationEntry) {
                },
                destroy: function () {
                    domConstruct.destroy(this.domNode);
                    this.viewModel = null;
                    this.inherited(arguments);
                }
            });
    });