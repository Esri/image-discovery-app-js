define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/text!./template/AddedFieldValuesTooltipContentsTemplate.html",
    "esriviewer/ui/base/UITemplatedWidget",
    "./model/AddedFieldsValuesTooltipContentsViewModel"
],
    function (declare, lang, template, UITemplatedWidget, AddedFieldsValuesTooltipContentsViewModel) {
        return declare(
            [UITemplatedWidget],
            {
                bindingsApplied: false,
                templateString: template,
                postCreate: function () {
                    this.viewModel = new AddedFieldsValuesTooltipContentsViewModel();
                    this.viewModel.addedFieldValues.subscribe(lang.hitch(this, this.handleFieldValueArrayChanged));
                },
                applyBindings: function () {
                    if (!this.bindingsApplied) {
                        ko.applyBindings(this.viewModel, this.domNode);
                    }
                },
                addFieldValue: function (fieldValue) {
                    var containsValue = this.viewModel.containsFieldValue(fieldValue);
                    if (!containsValue) {
                        this.viewModel.addedFieldValues.push(fieldValue);
                        return true;
                    }
                    return false;
                },
                getFieldValues: function () {
                    return this.viewModel.addedFieldValues();
                },
                hasFieldValues: function () {
                    return this.viewModel.addedFieldValues().length > 0;
                },
                handleFieldValueArrayChanged: function () {
                    if (this.viewModel.addedFieldValues().length == 0) {
                        this.onFieldValuesEmpty();
                    }
                },
                onFieldValuesEmpty: function () {

                },
                show: function () {
                    if (!this.bindingsApplied) {
                        this.applyBindings();
                        this.bindingsApplied = true;
                    }
                }
            });
    });