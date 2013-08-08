define([
    "dojo/_base/declare",
    "dojo/on",
    "dojo/topic",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "./base/SearchByGeometriesAggregator",
    "esriviewer/map/base/LayerQueryParameters"
],
    function (declare, on, topic, con, lang, SearchByGeometriesAggregator, LayerQueryParameters) {
        return declare(
            [],
            {
                resultFeaturesCount: 0,
                maxQueryResults: 100,
                currentServicesToQueryCount: 0,
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    this.lockRasterLookup = {};
                    this.loadViewerConfigurationData();
                    var mapRef;
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.GET, function (responseMap) {
                        mapRef = responseMap;
                    });
                    this.map = mapRef;
                    this.initListeners();
                },
                loadViewerConfigurationData: function () {
                    //load the configuration
                    var imageQueryControllerConfiguration;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY, "searchConfiguration", function (imageQueryControllerConf) {
                        imageQueryControllerConfiguration = imageQueryControllerConf;
                    });
                    if (imageQueryControllerConfiguration && lang.isObject(imageQueryControllerConfiguration)) {
                        if (imageQueryControllerConfiguration.maxQueryResults != null) {
                            this.maxQueryResults = imageQueryControllerConfiguration.maxQueryResults;
                        }
                    }
                },
                initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.HAS_NO_SOURCES_LOCKED, lang.hitch(this, this.handleHasNoSourcesLocked));

                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.HAS_SINGLE_SOURCE_LOCKED, lang.hitch(this, this.handleHasSingleSourceLocked));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET_BY_ID, lang.hitch(this, this.handleGetQueryLayerControllerById));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.LOADED, lang.hitch(this, this.handleSetQueryLayerControllers));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.SEARCH.GET_VALUES_FOR_FIELDS, lang.hitch(this, this.handleQueryValuesForFields));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.SEARCH.GEOMETRY, lang.hitch(this, this.handleQueryByGeometry));
                },
                handleQueryValuesForFields: function (layerQueryParameters) {
                    layerQueryParameters.whereClause = layerQueryParameters.layer.queryWhereClauseAppend ? layerQueryParameters.layer.queryWhereClauseAppend : "1 = 1";
                    topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.QUERY_LAYER, layerQueryParameters);
                },
                handleGetQueryLayerControllerById: function (id, callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        for (var i = 0; i < this.queryLayerControllers.length; i++) {
                            if (this.queryLayerControllers[i].id === id) {
                                callback(this.queryLayerControllers[i]);
                                return
                            }
                        }
                        callback(null);
                    }
                },
                //search image service by geometry
                handleQueryByGeometry: function (imageQueryControllerQueryParams) {
                    if (imageQueryControllerQueryParams == null) {
                        if (imageQueryControllerQueryParams.errback != null && lang.isFunction(imageQueryControllerQueryParams.errback)) {
                            imageQueryControllerQueryParams.errback("must pass query parameters");
                        }
                        return;
                    }
                    if (imageQueryControllerQueryParams.geometry == null) {
                        if (imageQueryControllerQueryParams.errback != null && lang.isFunction(imageQueryControllerQueryParams.errback)) {
                            imageQueryControllerQueryParams.errback("a geometry must be provided");
                        }
                        return;
                    }
                    this.handlePerformQuery(imageQueryControllerQueryParams);

                },
                //inner function that executes the image query
                handlePerformQuery: function (imageQueryControllerQueryParams) {
                    topic.publish(VIEWER_GLOBALS.EVENTS.THROBBER.BLOCK_HIDE);
                    this.resultFeaturesCount = 0;
                    this.queryResponseCount = 0;
                    this.currentServicesToQueryCount = imageQueryControllerQueryParams.queryLayerControllers.length;
                    for (var i = 0; i < imageQueryControllerQueryParams.queryLayerControllers.length; i++) {
                        var queryLayerController = imageQueryControllerQueryParams.queryLayerControllers[i];
                        var callback = lang.hitch(this, this.handleQueryResponseComplete, imageQueryControllerQueryParams.queryLayerControllers[i]);
                        if (imageQueryControllerQueryParams.errback == null) {
                            imageQueryControllerQueryParams.errback = lang.hitch(this, this.handleLayerIdsQueryError, imageQueryControllerQueryParams.queryLayerControllers[i]);
                        }
                        var queryLayerWhereClause = imageQueryControllerQueryParams.whereClause;
                        if (queryLayerWhereClause != null && queryLayerWhereClause.length > 0) {
                            if (queryLayerController.layer.queryWhereClauseAppend != null) {
                                queryLayerWhereClause += " AND " + queryLayerController.layer.queryWhereClauseAppend
                            }
                        }
                        else {
                            if (queryLayerController.layer.queryWhereClauseAppend != null) {
                                queryLayerWhereClause = queryLayerController.layer.queryWhereClauseAppend
                            }
                        }
                        var queryParamsForLayer = new LayerQueryParameters({
                            whereClause: queryLayerWhereClause,
                            returnGeometry: imageQueryControllerQueryParams.returnGeometry,
                            outFields: imageQueryControllerQueryParams.outFields,
                            geometry: imageQueryControllerQueryParams.geometry,
                            callback: callback,
                            errback: imageQueryControllerQueryParams.errback,
                            layer: queryLayerController.layer
                        });
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.QUERY_LAYER, queryParamsForLayer);
                    }
                },
                handleSetQueryLayerControllers: function (queryLayerControllers) {
                    if (queryLayerControllers != null && lang.isArray(queryLayerControllers) && queryLayerControllers.length > 0) {
                        this.queryLayerControllers = queryLayerControllers;
                    }
                    var currentQueryController;
                    for (var i = 0; i < this.queryLayerControllers.length; i++) {
                        currentQueryController = this.queryLayerControllers[i];
                        on(currentQueryController, currentQueryController.LOCK_RASTERS_CHANGED, lang.hitch(this, this.handleLockRastersChanged, currentQueryController))
                    }
                },
                handleHasNoSourcesLocked: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        var hasSingleSource = true;
                        var count = 0;
                        var lockRasterEntry;
                        for (var key in this.lockRasterLookup) {
                            count++;
                        }
                        callback(count == 0);
                    }
                },
                handleHasSingleSourceLocked: function (callback) {
                    if (callback != null && lang.isFunction(callback)) {
                        var hasSingleSource = true;
                        var count = 0;
                        var lockRasterEntry;
                        for (var key in this.lockRasterLookup) {
                            lockRasterEntry = this.lockRasterLookup[key];
                            if (++count > 1) {
                                hasSingleSource = false;
                                break;
                            }
                        }
                        callback(hasSingleSource && lockRasterEntry != null, lockRasterEntry);
                    }
                },
                handleLockRastersChanged: function (queryController, lockRasters) {
                    if (lockRasters == null || lockRasters.length == 0) {
                        delete this.lockRasterLookup[queryController.id];
                    }
                    else {
                        this.lockRasterLookup[queryController.id] = {lockRasterIds: lockRasters, queryController: queryController};
                    }
                    var hasMultiple = false;
                    var count = 0;
                    for (var key in this.lockRasterLookup) {
                        if (++count > 1) {
                            hasMultiple = true;
                            break;
                        }
                    }
                    if (count == 0) {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.NO_SOURCES_LOCKED);
                    }
                    else if (hasMultiple) {
                        var queryControllers = [];
                        for (var key in this.lockRasterLookup) {
                            queryControllers.push(this.lockRasterLookup[key]);
                        }
                        topic.publish(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.MULTIPLE_SOURCES_LOCKED, queryControllers);
                    }
                    else {
                        topic.publish(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.SINGLE_SOURCE_LOCKED, this.lockRasterLookup[queryController.id]);
                    }

                },
                //handles the image service query response
                handleQueryResponseComplete: function (queryLayerController, response) {
                    if (this.maxQueryResults != null && (this.resultFeaturesCount >= this.maxQueryResults)) {
                        return;
                    }
                    var maxResultsHit = false;
                    if (response == null) {
                        return;
                    }
                    var resultsString;
                    this.resultFeaturesCount += response.features.length;
                    if (this.maxQueryResults != null && (this.resultFeaturesCount > this.maxQueryResults)) {
                        resultsString = "Maximum results encountered (" + this.maxQueryResults + "). Please narrow your search.";
                        topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, resultsString);
                        response.features.splice(this.maxQueryResults, this.resultFeaturesCount - this.maxQueryResults);
                        maxResultsHit = true;
                    }
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.ADD, response, queryLayerController);
                    if (maxResultsHit || (++this.queryResponseCount == this.currentServicesToQueryCount)) {
                        resultsString = "Query Complete (" + this.resultFeaturesCount + " " + (this.resultFeaturesCount == 1 ? "Result" : "Results") + ")";
                        if (!maxResultsHit) {
                            topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, resultsString);
                        }
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.COMPLETE);
                        topic.publish(VIEWER_GLOBALS.EVENTS.THROBBER.RELEASE_HIDE_BLOCK);

                    }
                },
                handleLayerIdsQueryError: function (queryLayerController, err) {
                }
            });

    })
;