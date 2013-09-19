define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/_base/json",
    "esri/tasks/Geoprocessor",
    "dojo/text!./template/ImageryExportDownloadListTemplate.html",
    "esriviewer/ui/base/UITemplatedWidget",
    "./model/ImageryExportDownloadListViewModel"

],
    function (declare, topic, lang, json, Geoprocessor, template, UITemplatedWidget, ImageryExportDownloadListViewModel) {
        return declare(
            [ UITemplatedWidget],
            {
                templateString: template,
                bindingsApplied: false,

                constructor: function () {
                    this.downloadAllConfiguration = null;
                },
                postCreate: function () {
                    this.inherited(arguments);

                    this.handleDownloadAllItemsTaskErrorCallback = lang.hitch(this, this._handleDownloadAllItemsError);
                    this.handleDownloadAllItemsTaskResponseCallback = lang.hitch(this, this._handleDownloadAllItemsResponse);
                    this.handleProcessDownloadUrlCallback = lang.hitch(this, this._handleProcessDownloadUrl);

                    this.viewModel = new ImageryExportDownloadListViewModel();
                    this.viewModel.supportsDownloadAll(this.downloadAllConfiguration != null);
                },
                applyBindings: function () {
                    if (!this.bindingsApplied) {
                        ko.applyBindings(this.viewModel, this.domNode);
                        this.bindingsApplied = true;
                    }
                },
                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.DOWNLOAD.DOWNLOAD_ALL_IMAGERY, lang.hitch(this, this._handleDownloadAllImagery));

                },
                loadViewerConfigurationData: function () {
                    var exportConfig;
                    //get the display fields so we know what fields to export
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "exportConfiguration", function (exportConf) {
                        exportConfig = exportConf;
                    });
                    if (exportConfig != null && lang.isObject(exportConfig)) {
                        var imageryDownloadConf = exportConfig.imageryDownload;
                        if (imageryDownloadConf != null && lang.isObject(imageryDownloadConf)) {
                            if (imageryDownloadConf.task != null && lang.isObject(imageryDownloadConf.task) && imageryDownloadConf.task.url) {
                                this.downloadAllConfiguration = imageryDownloadConf;
                            }
                        }
                    }
                },
                clearDownloadList: function () {
                    this.viewModel.downloadAllInFlight(false);
                    this.viewModel.downloadAllLink(null);
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
                },
                /**
                 *
                 * @description listener for IMAGERY_GLOBALS.EVENTS.DOWNLOAD.DOWNLOAD_ALL_IMAGERY
                 * @param {Array} downloadItems  array of URLs to download url,label
                 * @private
                 */
                _handleDownloadAllImagery: function (downloadItems) {
                    var downloadFiles = [];
                    var currentDownloadItem = null;
                    for (var i = 0; i < downloadItems.length; i++) {
                        currentDownloadItem = downloadItems[i];
                        //get the child files
                        for (var j = 0; j < currentDownloadItem.values.length; j++) {
                            downloadFiles.push(currentDownloadItem.values[j]);
                        }
                    }
                    var jsonString = json.toJson(downloadFiles);
                    this._submitDownloadImageryJob(downloadFiles);
                },
                /**
                 * @description sends request to download GP task for downloading all imagery
                 * @param downloadArray
                 * @private
                 */
                _submitDownloadImageryJob: function (downloadArray) {
                    if (this.downloadAllImageryTask == null) {
                        this.downloadAllImageryTask = new Geoprocessor(this.downloadAllConfiguration.task.url);
                    }
                    var gpParams = {};
                    gpParams[this.downloadAllConfiguration.task.downloadItemInputParameter] = json.toJson(downloadArray);
                    this.viewModel.downloadAllInFlight(true);
                    if (this.downloadAllConfiguration.task.isAsync == null || this.downloadAllConfiguration.task.isAsync) {
                        this.downloadAllImageryTask.submitJob(gpParams, this.handleDownloadAllItemsTaskResponseCallback, null,
                            this.handleDownloadAllItemsTaskErrorCallback);
                    }
                    else {
                        this.downloadAllImageryTask.execute(gpParams, this.handleDownloadAllItemsTaskResponseCallback,
                            this.handleDownloadAllItemsTaskErrorCallback);
                    }
                },
                /**
                 * @description called when download all items finishes
                 * @param response
                 * @private
                 */
                _handleDownloadAllItemsResponse: function (response) {
                    if (response == null || !lang.isObject(response) || response.results == null) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Could not processed footprints download response. Please contact an administrator.");
                        VIEWER_UTILS.log("Could not processed download response. Please contact an administrator for help.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        return;
                    }
                    if (response.results[this.downloadAllConfiguration.task.outputUrlParameter] != null) {
                        //get the output URL
                        this.downloadAllImageryTask.getResultData(response.jobId, this.downloadAllConfiguration.task.outputUrlParameter, this.handleProcessDownloadUrlCallback);
                    }
                    else {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Synchronous GP not implemented for footprints export.");
                        VIEWER_UTILS.log("Synchronous GP not implemented for footprints export.", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    }
                    this.viewModel.downloadAllInFlight(false);
                },
                /**
                 * @description called when download all geoprocessing task failes
                 * @param err
                 * @return {null}
                 * @private
                 */
                _handleDownloadAllItemsError: function (err) {
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There was an error requesting download");
                    VIEWER_UTILS.log("There was an error requesting download", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                    this.viewModel.downloadAllInFlight(false);
                    return null;
                },
                /**
                 * @description sets the window location to the download url
                 * @param urlResponse
                 * @private
                 */
                _handleProcessDownloadUrl: function (urlResponse) {
                    if (urlResponse == null || !lang.isObject(urlResponse) || urlResponse.value == null || !lang.isObject(urlResponse.value) || urlResponse.value.url == null) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "There was an error requesting download URL");
                        VIEWER_UTILS.log("There was an error requesting download URL", VIEWER_GLOBALS.LOG_TYPE.ERROR);
                        this.viewModel.downloadAllLink(null);
                    }
                    else {
                        this.viewModel.downloadAllLink(urlResponse.value.url)

                    }
                }
            });
    });