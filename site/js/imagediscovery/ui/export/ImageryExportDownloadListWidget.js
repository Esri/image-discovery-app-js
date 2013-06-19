define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageryExportDownloadListTemplate.html",
    "esriviewer/ui/base/UITemplatedWidget",
    "./model/ImageryExportDownloadListViewModel"

],
    function (declare, template, UITemplatedWidget, ImageryExportDownloadListViewModel) {
        return declare(
            [ UITemplatedWidget],
            {
                templateString: template,
                bindingsApplied: false,

                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new ImageryExportDownloadListViewModel();
                },
                applyBindings: function () {
                    if (!this.bindingsApplied) {
                        ko.applyBindings(this.viewModel, this.domNode);
                        this.bindingsApplied = true;
                    }
                },
                clearDownloadList: function () {
                    this.viewModel.downloadItemsList.removeAll();

                },
                setDownloadList: function (downloadItems) {
                    this.clearDownloadList();
                    if (downloadItems == null) {
                        return;
                    }
                    var currentDownloadService;
                    var currentDownloadItem;
                    for (var key in downloadItems) {
                        currentDownloadService = downloadItems[key];
                        for (var i = 0; i < currentDownloadService.length; i++) {
                            currentDownloadItem = currentDownloadService[i];
                            if (currentDownloadItem.label != null && currentDownloadItem.url != null) {
                                if (currentDownloadItem.size == null) {
                                    currentDownloadItem.size = "?";
                                }
                            }
                        }
                        this.viewModel.downloadItemsList.push({name: key, values: currentDownloadService});
                    }

                    if (!this.bindingsApplied) {
                        this.applyBindings();
                    }
                }
            });
    });