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
                    //clear the previous list
                    this.clearDownloadList();
                    if (downloadItems == null) {
                        return;
                    }
                    var currentDownloadService;
                    var currentDownloadItem;
                    //loop through download items object and add them to the view model
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
                        //add to the view model
                        this.viewModel.downloadItemsList.push({name: key, values: currentDownloadService});
                    }

                    if (!this.bindingsApplied) {
                        //quirk of knockout. need to apply bindings AFTER items have been added to the download list the first time
                        this.applyBindings();
                    }
                }
            });
    });