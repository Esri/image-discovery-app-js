define([
        "dojo/_base/declare",
        "dojo/text!./template/DownloadWidgetTemplate.html",
//    "xstyle/css!./theme/DownloadWidgetTheme.css",
        "dojo/topic",
        "dojo/_base/lang",
        "esriviewer/ui/base/UITemplatedWidget",
        "../export/ImageryExportWidget",
        "../export/FootprintsExportWidget",
        "./model/DownloadViewModel",
        "../reporting/ReportingWidget",
        "../portal/PortalWebMapReportWidget"
    ],
    //  function (declare, template, theme, topic, lang,  UITemplatedWidget, ImageryExportWidget, FootprintsExportWidget, DownloadViewModel, ReportingWidget, PortalWebMapReportWidget) {
    function (declare, template, topic, lang, UITemplatedWidget, ImageryExportWidget, FootprintsExportWidget, DownloadViewModel, ReportingWidget, PortalWebMapReportWidget) {
        return declare(
            [UITemplatedWidget],
            {
                showWebMapCreationTab: true,
                templateString: template,
                constructor: function (params) {
                    lang.mixin(this, params || {});
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new DownloadViewModel();
                    this.viewModel.downloadImageryData.subscribe(lang.hitch(this, this.handleDownloadImageryVisibilityChange));
                    this.viewModel.downloadFootprintData.subscribe(lang.hitch(this, this.handleDownloadFootprintsVisibilityChange));
                    this.viewModel.reportingData.subscribe(lang.hitch(this, this.handleReportingVisibilityChange));

                    //see if the active layer supports download
                    var queryLayerControllers;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (qLyrCtrls) {
                        queryLayerControllers = qLyrCtrls;
                    });
                    var hasDownloadEnabled = false;
                    var currentQueryLayerController;
                    var currentQueryLayer;
                    if (queryLayerControllers) {
                        for (var i = 0; i < queryLayerControllers.length; i++) {
                            currentQueryLayerController = queryLayerControllers[i];
                            currentQueryLayer = currentQueryLayerController.layer;
                            if (IMAGERY_UTILS.layerSupportsDownload(currentQueryLayer)) {
                                hasDownloadEnabled = true;
                            }
                        }
                        if (!hasDownloadEnabled) {
                            this.viewModel.showDownloadImageryTab(false);
                            this.viewModel.showDownloadFootprintsContent();
                        }
                        else {
                            this.viewModel.showDownloadImageryTab(true);
                        }
                        this.viewModel.showWebMapCreationTab(this.showWebMapCreationTab);
                        ko.applyBindings(this.viewModel, this.domNode);
                        //create all of the contained widgets
                        this.createExportWidget();
                        this.createFootprintDownloadWidget();
                        this.createReportingWidget();
                        this.createWebMapPublishingWidget();
                    }
                },
                loadViewerConfigurationData: function () {
                    this.inherited(arguments);
                    var portalConfig = null, reportingConfig = null;
                    //get the portal configuration to check if we display the web map tab
                    topic.publish(VIEWER_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "portal", function (portalConf) {
                        portalConfig = portalConf;
                    });
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "reporting", function (reportingConf) {
                        reportingConfig = reportingConf;
                    });
                    if (portalConfig == null || !lang.isObject(portalConfig) || portalConfig.url == null || (reportingConfig && reportingConfig.disableWebMapReports)) {
                        this.showWebMapCreationTab = false;
                    }
                },
                /**
                 * clears graphics added to the map from the download widget
                 */
                clearActiveMapGraphics: function () {
                    if (this.imageryExportWidget) {
                        this.imageryExportWidget.clearDraw();
                        this.imageryExportWidget.viewModel.userDrawActive(false);
                    }
                    if (this.reportingWidget) {
                        this.reportingWidget.clearDraw();
                        this.reportingWidget.viewModel.userDrawActive(false);
                    }
                },
                handleReportingVisibilityChange: function (visible) {
                    if (!visible && this.reportingWidget) {
                        this.reportingWidget.clearDraw();
                        this.reportingWidget.viewModel.userDrawActive(false);
                    }
                },
                handleDownloadFootprintsVisibilityChange: function (visible) {
                    if (!visible && this.footprintExportWidget) {
                        this.footprintExportWidget.clearDraw();
                        this.footprintExportWidget.viewModel.userDrawActive(false);
                    }
                },
                handleDownloadImageryVisibilityChange: function (visible) {
                    if (!visible && this.imageryExportWidget) {
                        this.imageryExportWidget.clearDraw();
                        this.imageryExportWidget.viewModel.userDrawActive(false);
                    }
                },
                /**
                 * creates the reporting widget and add it to the DOM
                 */
                createReportingWidget: function () {
                    if (this.reportingWidget == null) {
                        this.reportingWidget = new ReportingWidget().placeAt(this.reportingContainer);
                    }
                },
                /**
                 * creates the web map publishing widget and add it to the DOM
                 */
                createWebMapPublishingWidget: function () {
                    if (this.webMapWidget == null) {
                        this.webMapWidget = new PortalWebMapReportWidget().placeAt(this.webMapCreationContainer);
                    }
                },
                /**
                 * creates the web imagery export widget and add it to the DOM
                 */
                createExportWidget: function () {
                    if (this.imageryExportWidget == null) {
                        this.imageryExportWidget = new ImageryExportWidget().placeAt(this.imageExportContainer);
                    }
                },
                createFootprintDownloadWidget: function () {
                    if (this.footprintExportWidget == null) {
                        this.footprintExportWidget = new FootprintsExportWidget().placeAt(this.downloadFootprintsContainer);
                    }
                }
            });
    });