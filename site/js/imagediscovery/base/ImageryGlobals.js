define([
    "dojo/_base/declare"
],
    function (declare) {
        return declare(
            [], {
                EVENTS: {
                    QUERY: {
                        COMPLETE: "query:complete",
                        LAYER_CONTROLLERS: {
                            LOADED: "querylayerControllers:loaded",
                            GET_BY_ID: "querylayerControllers:getById",
                            GET: "querylayerControllers:get"
                        },
                        RESULT: {
                            //fired when results from an image query has returned
                            ADD: "imgQuery:add",
                            //clears the current image service results
                            CLEAR: "imgQuery:clear",
                            GET_UNIQUE_VISIBLE_RASTER_ATTRIBUTES: "imgQuery:getUniqueVisibleRasterFields",
                            GET_UNIQUE_VISIBLE_ROW_ATTRIBUTES: "imgQuery:getUniqueVisibleRowFields",
                            QUERY_RESULT_SET: "imgQuery:queryResultSet",
                            GRAY_OUT_RESULTS_BY_FUNCTION: "imgQuery:grayByFunction",
                            CLEAR_GRAYED_OUT_RESULTS: "imgQuery:clearGrayedOutResults",
                            DISABLE_THUMBNAIL_CHECKBOXES: "imgQuery:disableFootprintCheckboxes",
                            ENABLE_THUMBNAIL_CHECKBOXES: "imgQuery:enableFootprintCheckboxes",
                            HIGHLIGHT_RESULTS_FOM_POINT_INTERSECT: "imgQuery:highlightResultsFromPointIntersect",
                            HIGHLIGHT_RESULTS_FOM_RECTANGLE_INTERSECT: "imgQuery:highlightResultsFromRectangleIntersect",
                            SHOW_IMAGE_FROM_POINT_INTERSECT: "imgQuery:showImageFromPointIntersect",
                            SHOW_IMAGE_FROM_RECTANGLE_INTERSECT: "imgQuery:showImageFromRectangleIntersect",
                            CLEAR_HIGHLIGHTED_RESULTS: "imgQuery:clearHighlightedResults",
                            ORDER_BY_LOCK_RASTER: "imgQuery:orderByLockRaster",
                            GET_VISIBLE_GRID_RESULT_COUNT: "imgQuery:visGrRsCnt",
                            RESULT_GRID_POPULATED: "imgQuery:rsGrPopulated",
                            GET_VISIBLE_FOOTPRINT_GEOMETRIES: "imgQuery:getVsFtPtGeoms",
                            GET_VISIBLE_FOOTPRINT_FEATURES: "imgQuery:getVsFtPtFeatures"
                        },
                        SEARCH: {
                            //search image service by geometry
                            GEOMETRY: "igVrSearch:geometry",
                            GET_VALUES_FOR_FIELDS: "igVrSearch:getValuesForFields"
                        },
                        WINDOW: {
                            //shows the image query window
                            SHOW: "imgQWindow:show",
                            //hides the image query window
                            HIDE: "imgQWindow:hide"
                        },
                        FILTER: {
                            BEFORE_CLEAR: "fitler:beforeClear",
                            CLEARED: "filter:cleared",
                            SET: "filter:set",
                            USER_ENABLE: "filter:usrEnable",
                            USER_DISABLE: "filter:usrDisable",
                            ADDED: "filter:added",
                            ADD_USER_LOCK: "filter:addLock",
                            REMOVE_USER_LOCK: "filter:removeLock",
                            ADD_FILTER_FUNCTION: "filter:addFunction",
                            REMOVE_FILTER_FUNCTION: "filter:removeFunction",
                            RELOAD_FILTER_FUNCTION: "filter:reloadFilterFunction",
                            APPLIED: "filter:applied",
                            HIDE_RESET_ICON: "filter:hidereset",
                            SHOW_RESET_ICON: "filter:showreset",
                            BEFORE_APPLY: "filter:beforeApply"
                        }
                    },
                    TIME_SLIDER: {
                        HIDE_ICON: "timeSlider:hideIcon",
                        SHOW_ICON: "timeSlider:showIcon"
                    },
                    CART: {
                        REMOVED_FROM_CART: "cart:resRmFromCt",
                        REMOVE_FROM_CART: "cart:rmResFromCt",
                        ADD_TO: "cart:addTo",
                        GET_ADDED_OBJECT_IDS: "cart:gAddedObjIds",
                        DISPLAYED: "cart:displayed",
                        HIDDEN: "cart:hidden",
                        IS_VISIBLE: "cart:isVisible"
                    },
                    LAYER: {
                        //clears the lock ids for all  catalog image services
                        CLEAR_IDS: "imgVLyr:clearIds",
                        //clears the current footprints
                        CATALOG_LAYERS_LOADED: "imgVLyr:clgLyrsLoaded",
                        GET_CATALOG_LAYERS: "imgVLyr:gclLyrs",
                        TIME: {
                            WINDOW: {
                                SHOW: "imageryTime:show",
                                HIDE: "imageryTime:hide",
                                TOGGLE: "imageryTime:toggle"
                            }
                        },
                        FOOTPRINTS_LAYER_DISPLAYED: "lyr:ftPrintsLyrDisplayed",
                        CLUSTER_LAYER_DISPLAYED: "lyr:clstrLyrDisplayed",
                        FOOTPRINTS_LAYER_VISIBLE: "lyr:ftPrintsLyrVisible",
                        SET_FOOTPRINTS_LAYER_TRANSPARENT: "lys:ftPrintsLyrTrans",
                        SET_FOOTPRINTS_LAYER_OPAQUE: "lys:ftPrintsLyrOpq",
                        HIGHLIGHT_FOOTPRINT: "lyr:highlightFtPrint",
                        UNHIGHLIGHT_FOOTPRINT:"lyr:unhighlightFtPrint"
                    },
                    LOCK_RASTER: {
                        CLEAR_ALL: "lRaster:clearIds",
                        HAS_NO_SOURCES_LOCKED: "lRaster:hasNoSrcLocked",
                        HAS_SINGLE_SOURCE_LOCKED: "lRaster:hasSgleSrcLocked",
                        MULTIPLE_SOURCES_LOCKED: "lRaster:multiSrcLocked",
                        NO_SOURCES_LOCKED: "lRaster:noSrcLocked",
                        SINGLE_SOURCE_LOCKED: "lRaster:singleSrcLocked"//,
                        //   CART_SOURCE_LOCKED:  "lRaster:cartSrcLocked"
                    },
                    IMAGE: {
                        INFO: {
                            //shows the image info window
                            SHOW: "imgInfo:show",
                            //hides the image info window
                            HIDE: "imgInfo:hide"
                        }
                    },
                    SWIPE: {
                        WINDOW: {
                            SHOW: "swipeWd:show",
                            HIDE: "swipeWd:hide",
                            TOGGLE: "swipeWd:toggle"
                        }
                    },
                    MENSURATION: {
                        WINDOW: {
                            SHOW: "mensWd:show",
                            HIDE: "mensWd:hide"
                        }
                    },
                    GEOMETRY: {
                        UPLOAD: {
                            WINDOW: {
                                SHOW: "gUlWd:show",
                                HIDE: "gUlWd:hide"
                            }
                        }
                    },
                    DISCOVERY: {
                        ON_SHOW: "discovery:onShow"
                    },
                    CONFIGURATION: {
                        GET_QUERY_SERVICES_INFO: "imgConfig:getQueryServicesInfo",
                        GET: "imgConfig:get",
                        GET_ENTRY: "imgConfig:getEntry"
                    },
                    DOWNLOAD: {
                        WINDOW: {
                            SHOW: "rptWindow:show",
                            HIDE: "rptWindow:hide",
                            TOGGLE: "rptWindow:toggle"
                        }
                    },
                    MANIPULATION: {
                        STOP: "manip:stop",
                        SHOW_DISABLED_VIEW: "manip:showDisabledView",
                        WINDOW: {
                            SHOW: "manipWin:show",
                            HIDE: "manipWin:hide",
                            TOGGLE: "manipWin:toggle"
                        }
                    },
                    PLACEMENT: {
                        GLOBAL: {
                            PLACE: {
                                DISCOVERY_WIDGET: "place:discoveryWidg"
                            }
                        },
                        WINDOWLESS: {
                            PLACE: {
                                MANIPULATION_WIDGET: "place:manipWidg"
                            }
                        }

                    },
                    TRANSPARENCY: {
                        POPUP: {
                            SHOW: "layerTransparencyWd:show",
                            HIDE: "layerTransparencyWd:hide"
                        }
                    }
                }
            });
    });

