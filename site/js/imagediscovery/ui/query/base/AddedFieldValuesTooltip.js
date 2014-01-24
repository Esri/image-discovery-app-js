define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dijit/popup",
    "dijit/TooltipDialog",
    "./AddedFieldValuesToolipContents",
    "esriviewer/ui/base/UIWidget"

],
    function (declare, lang,popup, TooltipDialog, AddedFieldValuesToolipContents, UIWidget) {
        return declare(
            [UIWidget],
            {
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    this._createTooltip();
                },
                _createTooltip: function () {
                    this.addedFieldValuesContent = new AddedFieldValuesToolipContents();
                    this.addedFieldValuesContent.on("fieldValuesEmpty", lang.hitch(this, this.handleFieldValuesEmpty));
                    this.tooltip = new TooltipDialog({ content: this.addedFieldValuesContent.domNode});
                    this.tooltip.on("hide", lang.hitch(this, this.handleTooltipHide));
                },
                handleTooltipHide: function () {
                    this.visible = false;
                },
                addFieldValue: function (fieldValue) {
                    if (this.addedFieldValuesContent.addFieldValue(fieldValue)) {
                        this.onItemAdded()
                    }
                },
                hasAroundNode: function () {
                    return this.aroundNode != null;
                },
                show: function () {
                    if (!this.addedFieldValuesContent.hasFieldValues()) {
                        return;
                    }
                    if (!this.hasAroundNode()) {
                        this.onError("No Position passed for popup");
                        return;
                    }
                    var params = {
                        popup: this.tooltip
                    };
                    params.around = this.aroundNode;

                    if (this.tooltip) {
                        popup.open(params);
                        this.addedFieldValuesContent.show();

                        this.visible = true;
                    }
                },
                toggle: function () {
                    if (this.visible) {
                        this.hide();
                    }
                    else {
                        this.show();
                    }
                },
                hide: function () {
                    if (this.tooltip) {
                        popup.close(this.tooltip);
                        this.visible = false;
                    }
                },
                handleFieldValuesEmpty: function () {
                    this.hide();
                    this.onEmpty();
                },
                hasFieldValues: function () {
                    return this.addedFieldValuesContent.hasFieldValues();
                },
                getFieldValues: function () {
                    return this.addedFieldValuesContent.getFieldValues();
                },
                onEmpty: function () {

                },
                onItemAdded: function () {

                }

            });
    });