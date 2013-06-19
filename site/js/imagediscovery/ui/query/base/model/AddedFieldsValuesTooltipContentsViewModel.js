define([
    "dojo/_base/declare"
],
    function (declare) {
        return declare(
            [],
            {
                constructor: function () {
                    var self = this;
                    this.addedFieldValues = ko.observableArray();

                    this.removeFieldValue = function (fieldValueItem) {
                        if (fieldValueItem == null) {
                            return;
                        }
                        self.addedFieldValues.remove(fieldValueItem);
                    };
                },
                containsFieldValue: function (fieldValue) {
                    return this.addedFieldValues.indexOf(fieldValue) > -1;
                }


            });

    })
;