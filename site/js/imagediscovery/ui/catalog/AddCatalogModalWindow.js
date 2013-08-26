define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esriviewer/ui/base/UIWidget",
    "./AddCatalogWizard",
    "dojo/_base/window",
    "dojo/dom-construct",
    "dojo/dom-class"
],
    function (declare, lang, UIWidget, AddCatalogWizard, window, domConstruct, domClass) {
        return declare(
            [UIWidget],
            {
                postCreate: function () {
                    this.inherited(arguments);
                    this.addCatalogWizard = new AddCatalogWizard();
                    this.addCatalogWizard.placeAt(this.domNode);
                    this.addCatalogWizard.on("catalogSet", lang.hitch(this, this._onCatalogSet));
                    domClass.add(this.domNode, "addCatalogModalWindow defaultBoxShadow");
                    domConstruct.place(this.domNode, window.body());
                },
                _onCatalogSet: function (configurationEntry) {
                    this.onCatalogSet(configurationEntry);
                },
                onCatalogSet: function (configurationEntry) {
                },
                destroy: function () {
                    this.addCatalogWizard.destroy();
                    this.addCatalogWizard = null;
                    domConstruct.destroy(this.domNode);
                    this.inherited(arguments);
                }
            });
    });
