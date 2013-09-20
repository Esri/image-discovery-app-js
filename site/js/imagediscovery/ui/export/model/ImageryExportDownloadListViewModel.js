define([
    "dojo/_base/declare",
    "dojo/topic"
],
    function (declare, topic) {
        return declare(
            [],
            {
                DOWNLOAD_IMAGERY: "downloadImagery",
                constructor: function () {
                    var self = this;
                    this.downloadItemsList = ko.observableArray();
                    this.supportsDownloadAll = ko.observable(false);
                    this.downloadAllInFlight = ko.observable(true);
                    this.downloadAllLink = ko.observable(null);
                    this.showDownloadAllText = ko.computed(function () {
                        return self.supportsDownloadAll() && !self.downloadAllInFlight() && self.downloadAllLink() == null
                    });
                    this.downloadAllLinkVisible = ko.computed(function () {
                        return self.downloadAllLink() && !self.downloadAllInFlight()
                    });
                },
                handleDownloadAll: function () {
                    topic.publish(IMAGERY_GLOBALS.EVENTS.DOWNLOAD.DOWNLOAD_ALL_IMAGERY, this.downloadItemsList());
                },
                handleDownloadAllLinkClick: function () {
                    window.location = this.downloadAllLink();
                }
            });

    })
;