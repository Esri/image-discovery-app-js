define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "esri/geometry/Extent"
],
    function (declare, lang, topic, Extent) {
        return declare(
            [],
            {
                //handles zoom to result request
                handleZoomToResult: function (entry, e) {
                    if (entry.geometry && lang.isFunction(entry.geometry.getExtent)) {
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.SET_EXTENT, entry.geometry.getExtent());
                    }
                },
                //handles show information window for a result
                //footprint checkbox toggle listener
                handleShowFootprintToggle: function (item, checked) {
                    item.showFootprint = checked;
                    var queryController = IMAGERY_UTILS.getQueryLayerControllerFromItem(item);
                    if (queryController) {
                        if (item.showFootprint) {
                            queryController.showFootprint(item);
                        }
                        else {
                            queryController.hideFootprint(item);
                        }
                    }
                },
                //forces the show of thumbnail
                handleShowThumbNailToggle: function (item, checked) {
                    item.showThumbNail = checked;
                    this.setSelectedThumbnails();
                },
                //given a query controller id it will show footprints that are checked in the grid
                showVisibleFootprintsByQueryControllerId: function (queryControllerId) {
                    var items = this.store.query({showFootprint: true, isFiltered: false, isGrayedOut: false, queryControllerId: queryControllerId});
                    var queryLayerControllerItemsArray = IMAGERY_UTILS.sortItemsIntoQueryControllerArray(items);
                    var currentQueryLayerController;
                    var currentQueryLayerControllerItems;
                    for (var i = 0; i < queryLayerControllerItemsArray.length; i++) {
                        currentQueryLayerController = queryLayerControllerItemsArray[i].queryController;
                        currentQueryLayerControllerItems = queryLayerControllerItemsArray[i].items;
                        for (var j = 0; j < currentQueryLayerControllerItems.length; j++) {
                            currentQueryLayerController.showFootprint(currentQueryLayerControllerItems[j]);
                        }
                    }
                },
                //given a query controller id it will hide footprints that are not checked in the grid
                hideVisibleFootprintsByQueryControllerId: function (queryControllerId) {
                    var items = this.store.query({showFootprint: true, isFiltered: false, isGrayedOut: false, queryControllerId: queryControllerId});
                    var queryLayerControllerItemsArray = IMAGERY_UTILS.sortItemsIntoQueryControllerArray(items);
                    var currentQueryLayerController;
                    var currentQueryLayerControllerItems;
                    for (var i = 0; i < queryLayerControllerItemsArray.length; i++) {
                        currentQueryLayerController = queryLayerControllerItemsArray[i].queryController;
                        currentQueryLayerControllerItems = queryLayerControllerItemsArray[i].items;
                        for (var j = 0; j < currentQueryLayerControllerItems.length; j++) {
                            currentQueryLayerController.hideFootprint(currentQueryLayerControllerItems[j]);
                        }
                    }
                },
                //displays all footprints checked in the result grid
                showVisibleFootprints: function () {
                    var queryControllers;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (queryConts) {
                        queryControllers = queryConts;
                    });
                    if (queryControllers && lang.isArray(queryControllers)) {
                        for (var i = 0; i < queryControllers.length; i++) {
                            this.showVisibleFootprintsByQueryControllerId(queryControllers[i].id);
                        }
                    }
                },
                restoreVisibleFootprints: function () {
                    if (this.tempFootprintHideStateActive) {
                        this.showVisibleFootprints();
                        this.tempFootprintHideStateActive = false;
                    }
                },
                //this temp hides footprints but does not alter the showFootprint flag on the object. call restoreVisibleFootprints to show them again.
                hideVisibleFootprints: function () {
                    if (!this.tempFootprintHideStateActive) {
                        var queryControllers;
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET, function (queryConts) {
                            queryControllers = queryConts;
                        });
                        if (queryControllers && lang.isArray(queryControllers)) {
                            for (var i = 0; i < queryControllers.length; i++) {
                                this.hideVisibleFootprintsByQueryControllerId(queryControllers[i].id);
                            }
                        }
                        this.tempFootprintHideStateActive = true;
                    }
                },
                setSelectedThumbnailsSorted: function (sort) {
                    //todo: need to figure out how to clear for items not in the result set
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LOCK_RASTER.CLEAR_ALL);
                    var items = this.store.query({showThumbNail: true, isFiltered: false, isGrayedOut: false}, {sort: sort});
                    var queryLayerControllerItemsArray = IMAGERY_UTILS.sortItemsIntoQueryControllerArray(items);
                    var currentQueryController;
                    var currentItemsForQueryController;
                    for (var i = 0; i < queryLayerControllerItemsArray.length; i++) {
                        currentQueryController = queryLayerControllerItemsArray[i].queryController;
                        currentItemsForQueryController = queryLayerControllerItemsArray[i].items;
                        if (currentItemsForQueryController.length === 0) {
                            currentQueryController.clearLockIds();
                        }
                        else {
                            currentQueryController.setLockIds(currentItemsForQueryController);
                        }
                    }
                },
                setSelectedThumbnails: function () {
                    var sort = this.grid.get("sort");
                    this.setSelectedThumbnailsSorted(sort);
                },
                //zooms to extent of all visible rasters
                zoomToVisibleRasters: function () {
                    var xmin;
                    var ymin;
                    var xmax;
                    var ymax;
                    var spatialReference;
                    var hasItem = false;
                    var currentExtent;
                    var currentItem;
                    var items = this.store.query({showThumbNail: true, isFiltered: false});
                    for (var i = 0; i < items.length; i++) {
                        currentItem = items[i];
                        if (currentItem.geometry && lang.isFunction(currentItem.geometry.getExtent)) {
                            currentExtent = items[i].geometry.getExtent();
                            if (i != 0) {
                                if (currentExtent.xmin < xmin) {
                                    xmin = currentExtent.xmin;
                                }
                                if (currentExtent.ymin < ymin) {
                                    ymin = currentExtent.ymin;
                                }
                                if (currentExtent.xmax > xmax) {
                                    xmax = currentExtent.xmax;
                                }
                                if (currentExtent.ymax > ymax) {
                                    ymax = currentExtent.ymax;
                                }
                            }
                            else {
                                xmin = currentExtent.xmin;
                                ymin = currentExtent.ymin;
                                xmax = currentExtent.xmax;
                                ymax = currentExtent.ymax;
                                spatialReference = currentExtent.spatialReference;
                            }
                            hasItem = true;
                        }
                    }
                    if (hasItem) {
                        var extent = new Extent(xmin, ymin, xmax, ymax, spatialReference);
                        topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.SET_EXTENT, extent);
                    }
                },
                /*
                 handleToggleAllFootprints: function (checked) {
                 this.grid.toggleAllFootprints(checked);
                 },
                 */
                handleToggleAllThumbnails: function (checked) {
                    this.grid.toggleAllThumbnails(checked);
                }
            });
    });