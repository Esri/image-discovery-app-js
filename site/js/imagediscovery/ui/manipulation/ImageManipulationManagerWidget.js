define([
    "dojo/_base/declare",
    "dojo/text!./template/ImageManipulationManagerTemplate.html",
   // "xstyle/css!./theme/ImageManipulationTheme.css",
    "dojo/_base/lang",
    "dojo/topic",
    'dijit/layout/ContentPane',
    "dijit/form/Select",
    "esriviewer/ui/base/UITemplatedWidget",
    "./ImageManipulationContentWidget",
    "./model/ImageManipulationManagerViewModel"
],
  //  function (declare, template, theme, lang, topic,  ContentPane, Select, UITemplatedWidget, ImageManipulationContentWidget, ImageManipulationManagerViewModel) {
    function (declare, template,  lang, topic,  ContentPane, Select, UITemplatedWidget, ImageManipulationContentWidget, ImageManipulationManagerViewModel) {
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

                    //listen for manipulation stop
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.STOP, lang.hitch(this, this.handleStopManipulation));
                    //listen for results being cleared
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.handleResultsCleared));

                    //listen for when the cart has been displayed
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.DISPLAYED, lang.hitch(this, this.handleCartViewDisplayed));
                    //listen for when the cart has been hidden
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.CART.HIDDEN, lang.hitch(this, this.checkForAnalysisEnabled));
                    //listen for when no sources are locked on
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.NO_SOURCES_LOCKED, lang.hitch(this, this.handleNoSourcesLocked));
                    //listen for when multiple sources are locked
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.MULTIPLE_SOURCES_LOCKED, lang.hitch(this, this.handleMultipleSourcesLocked));
                    //listen for when a single source is locked on
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.SINGLE_SOURCE_LOCKED, lang.hitch(this, this.handleSingleSourceLocked));

                    //listen for when the footprints layer is displayed. at footprint zoom level the imagery is visible
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_DISPLAYED, lang.hitch(this, this.handleImageryLayersVisible));
                    //imagery is hidden when the cluster layer is visible
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LAYER.CLUSTER_LAYER_DISPLAYED, lang.hitch(this, this.handleImageryLayersHidden));

                },
                handleImageryLayersHidden: function () {
                    this.hideManipulationContent("Zoom into imagery view for manipulation");
                    this.cancelMensuration();
                },
                handleImageryLayersVisible: function () {
                    this.checkForAnalysisEnabled();
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.createViewModel();
                    ko.applyBindings(this.viewModel, this.domNode);
                },
                createViewModel: function () {
                    this.viewModel = new ImageManipulationManagerViewModel();
                    //show the disabled view on creation of the manipulation view
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.MANIPULATION.SHOW_DISABLED_VIEW, lang.hitch(this.viewModel, this.viewModel.disabledContainer, true));
                },
                handleSingleSourceLocked: function (lockRasterObject) {
                    //if a single source is locked we show the analysis content
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
                /**
                 *  listener for IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.NO_SOURCES_LOCKED
                 */
                handleNoSourcesLocked: function () {
                    // no sources locked so hide the analysis content
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
                /**
                 * listener for IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.MULTIPLE_SOURCES_LOCKED
                 */
                handleMultipleSourcesLocked: function () {
                    //hide the analysis content for multiple sources. can only analyze a single source
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
                /**
                 *  listener for IMAGERY_GLOBALS.EVENTS.CART.DISPLAYED
                 */
                handleCartViewDisplayed: function () {
                    //show disabled text for the exploitation
                    this.hideManipulationContent("Analysis disabled for shopping cart.");
                },
                /**
                 * function checks state of discovery application to see if the analysis widget should be enabled
                 */
                checkForAnalysisEnabled: function () {
                    var hasSingleSourceLocked = false;
                    var hasNoSourcesLocked = false;
                    var queryLayerControllerObject;
                    var isFootprintsLayerVisible;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.FOOTPRINTS_LAYER_VISIBLE, function (fprintLayerVis) {
                        isFootprintsLayerVisible = fprintLayerVis;
                    });
                    if (!isFootprintsLayerVisible) {

                        this.hideManipulationContent("Zoom into imagery view for manipulation");
                        return;
                    }
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.HAS_NO_SOURCES_LOCKED, function (noSourcesLocked) {
                        hasNoSourcesLocked = noSourcesLocked;
                    });
                    if (hasNoSourcesLocked) {
                        this.hideManipulationContent("There is no imagery visible");
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
                /**
                 * called when all results are cleared. Analysis is set to disabled since there are no results
                 */
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
                /**
                 * shows the manipulation widget using parameters on the layer inside queryLayerController
                 * @param queryLayerController controller containing the layer to use for manipulation
                 */
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
                /**
                 * creates a manipulation widget for the passed query layer controller
                 * @param queryLayerController
                 * @return {imagediscovery.ui.manipulation.ImageManipulationContentWidget}
                 */
                createManipulationContent: function (queryLayerController) {
                    var imageManipulationContentWidget = new ImageManipulationContentWidget();
                    imageManipulationContentWidget.placeAt(this.imageManipulationEnabledContainer);
                    imageManipulationContentWidget.setQueryLayerController(queryLayerController);
                    return imageManipulationContentWidget;
                },
                /**
                 * hides the manipulation content and displays the passed message
                 * @param message
                 */
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