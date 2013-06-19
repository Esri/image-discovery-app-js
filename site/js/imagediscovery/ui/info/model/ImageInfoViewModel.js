define([
    "dojo/_base/declare",
    "dojo/_base/lang"
],
    function (declare,lang) {
        return declare(
            [],
            {
                attributes: ko.observable(true),
                thumbnail: ko.observable(false),
                attributesClick: function () {
                    this.attributes(true);
                },
                thumbnailClick: function () {
                    this.thumbnail(true);
                },

                constructor: function () {
                    this.attributes.subscribe(lang.hitch(this,function (selected) {
                        if (selected) {
                            this.thumbnail(false);
                        }
                    }));
                    this.thumbnail.subscribe(lang.hitch(this,function (selected) {
                        if (selected) {
                            this.attributes(false);
                        }
                    }));
                }

            });

    })
;