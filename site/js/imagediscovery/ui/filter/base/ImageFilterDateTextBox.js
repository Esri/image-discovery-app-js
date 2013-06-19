define([
    "dojo/_base/declare",
    "dijit/form/DateTextBox"
],
    function (declare, DateTextBox) {
        return declare(
            [DateTextBox],
            {
                openDropDown: function () {
                    this.inherited(arguments);
                    this.dropDown.isDisabledDate = this.disabledCheckFunction;
                    this.dropDown._populateGrid();
                },
                disabledCheckFunction: function (date) {
                    return false;
                }
            });

    });