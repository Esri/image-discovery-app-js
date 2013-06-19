define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageManipulationManagerTemplate.html",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/on",
    'dijit/layout/ContentPane',
    "dijit/form/Select",
    "esriviewer/ui/base/UITemplatedWidget",
    "./ImageManipulationContentWidget",
    "./model/ImageManipulationManagerViewModel"
],
    function (declare, template, lang, topic, on, ContentPane, Select, UITemplatedWidget, ImageManipulationContentWidget, ImageManipulationManagerViewModel) {
        return declare(
            [ContentPane, UITemplatedWidget],
            {
                title: "Analysis",
                templateString: template,
                constructor: function () {
                    this.queryLayerControllerToManipulationWidgetLookup = {};
                },
                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP, lang.hitch(this, this.handleStopManipulation));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.handleResultsCleared));

                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.DISPLAYED, lang.hitch(this, this.handleCartViewDisplayed));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.HIDDEN, lang.hitch(this, this.handleCartViewHidden));

                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.NO_SOURCES_LOCKED, lang.hitch(this, this.handleNoSourcesLocked));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.MULTIPLE_SOURCES_LOCKED, lang.hitch(this, this.handleMultipleSourcesLocked));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.SINGLE_SOURCE_LOCKED, lang.hitch(this, this.handleSingleSourceLocked));
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.createViewModel();
                    ko.applyBindings(this.viewModel, this.domNode);
                },
                createViewModel: function () {
                    this.viewModel = new ImageManipulationManagerViewModel();
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.SHOW_DISABLED_VIEW, lang.hitch(this.viewModel, this.viewModel.disabledContainer, true));
                },
                handleSingleSourceLocked: function (lockRasterObject) {
                    var cartVisible = false;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.IS_VISIBLE, function (vis) {
                        cartVisible = vis;
                    });
                    if (cartVisible) {
                        this.hideManipulationContent("Analysis disabled for shopping cart.");

                        return;
                    }
                    if (lockRasterObject && lockRasterObject.lockRasterIds && lockRasterObject.lockRasterIds.length > 0 && lockRasterObject.queryController) {
                        this.showManipulationContent(lockRasterObject.queryController);
                    }
                    else {
                        this.hideManipulationContent("Cannot perform analysis");
                    }
                },
                handleNoSourcesLocked: function () {
                    var cartVisible = false;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.IS_VISIBLE, function (vis) {
                        cartVisible = vis;
                    });
                    if (cartVisible) {
                        this.hideManipulationContent("Analysis disabled for shopping cart.");

                        return;
                    }
                    this.hideManipulationContent("There is no imagery to analyze.");
                },
                handleMultipleSourcesLocked: function () {
                    var cartVisible = false;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CART.IS_VISIBLE, function (vis) {
                        cartVisible = vis;
                    });
                    if (cartVisible) {
                        this.hideManipulationContent("Analysis disabled for shopping cart.");
                        return;
                    }
                    this.hideManipulationContent("Cannot perform analysis on multiple sources");
                },
                handleCartViewDisplayed: function () {
                    //show disabled text for the exploitation

                    this.hideManipulationContent("Analysis disabled for shopping cart.");
                },
                handleCartViewHidden: function () {
                    var hasSingleSourceLocked = false;
                    var hasNoSourcesLocked = false;
                    var queryLayerControllerObject;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.HAS_NO_SOURCES_LOCKED, function (noSourcesLocked) {
                        hasNoSourcesLocked = noSourcesLocked;
                    });
                    if (hasNoSourcesLocked) {
                        this.hideManipulationContent("Cannot perform analysis");
                        return;
                    }
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.HAS_SINGLE_SOURCE_LOCKED, function (sglSrc, queryConObj) {
                        hasSingleSourceLocked = sglSrc;
                        queryLayerControllerObject = queryConObj;
                    });
                    if (!hasSingleSourceLocked) {
                        this.hideManipulationContent("Cannot perform analysis on multiple sources");

                    }
                    else {
                        var queryLayerController = queryLayerControllerObject.queryController;
                        this.showManipulationContent(queryLayerController);
                    }
                },
                handleResultsCleared: function () {
                    this.handleClearAllManipulations();
                    this.viewModel.disabledContainer(true);
                    this.setDisabledText();
                },
                setDisabledText: function (message) {
                    if (message == null || message == "") {
                        message = this.viewModel.defaultDisabledText;
                    }
                    this.viewModel.disabledText(message);
                },
                hideDisabledView: function () {
                    this.viewModel.disabledContainer(false);
                },
                handleClearAllManipulations: function () {
                    //cancel raster function if active
                    //reset bands
                    topic.publish(IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP);

                    if (this.currentManipulationVisibleContent) {
                        this.currentManipulationVisibleContent.clearAllImageManipulations();
                    }
                },
                cancelMensuration: function () {
                    if (this.currentManipulationVisibleContent && this.currentManipulationVisibleContent.mensurationWidget) {
                        this.currentManipulationVisibleContent.mensurationWidget.cancelMensuration();
                    }
                },
                showManipulationContent: function (queryLayerController) {
                    if (this.currentManipulationVisibleContent) {
                        this.currentManipulationVisibleContent.hide();
                    }
                    this.viewModel.manipulationContainer(true);
                    var manipulationContent;
                    if (this.queryLayerControllerToManipulationWidgetLookup[queryLayerController.id] == null) {
                        this.queryLayerControllerToManipulationWidgetLookup[queryLayerController.id] = this.createManipulationContent(queryLayerController);
                    }
                    this.currentManipulationVisibleContent = this.queryLayerControllerToManipulationWidgetLookup[queryLayerController.id];
                    this.currentManipulationVisibleContent.show();
                    this.currentManipulationVisibleContent.selectNextVisibleTab();
                },
                createManipulationContent: function (queryLayerController) {
                    var imageManipulationContentWidget = new ImageManipulationContentWidget();
                    imageManipulationContentWidget.placeAt(this.imageManipulationEnabledContainer);
                    imageManipulationContentWidget.setQueryLayerController(queryLayerController);
                    return imageManipulationContentWidget;
                },
                hideManipulationContent: function (message) {
                    if (message == null) {
                        message = this.viewModel.defaultDisabledText;
                    }
                    this.viewModel.disabledText(message);
                    this.viewModel.disabledContainer(true);
                },
                handleStopManipulation: function () {
                    //override
                }

            });
    });