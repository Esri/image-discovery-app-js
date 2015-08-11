define([
    "dojo/_base/declare"
],
    function (declare) {
        return declare(
            [], {
                EVENTS: {
                    UPLOADER:{
                        WINDOW: {
                            SHOW: "upldrWindow:show",
                            HIDE: "upldrWindow:hide",
                            TOGGLE: "upldrWindow:toggle"
                        }
                    },
                    IDENTIFY: {
                        //performs a server side identify on all query layer controllers that were used in the current search
                        BY_POINT: "identifyqueryLyr:byPoint",
                        ADD_RESULT: "identifyqueryLyr:addResult",
                        CLEAR: "identifyqueryLyr:clear",
                        STARTED: "identifyqueryLyr:started"
                    },

                    QUERY: {
                        //fires when a query is complete
                        COMPLETE: "query:complete",
                        LAYER_CONTROLLERS: {
                            //fired when all layer controllers are loaded
                            LOADED: "querylayerControllers:loaded",
                            //get controller by controller id
                            GET_BY_ID: "querylayerControllers:getById",
                            //get all query layer controllers
                            GET: "querylayerControllers:get"
                        },
                        RESULT: {
                            SHOW_POPUP: "imgQuery:showPopup",
                            SHOW_POPUP_FROM_MAP_COORDINATES: "imgQuery:showPopupFromMapCoordinates",
                            //fired when results from an image query has returned
                            ADD: "imgQuery:add",
                            //clears the current image service results
                            CLEAR: "imgQuery:clear",
                            //gets unique field values for rasters that are visible on the map
                            GET_UNIQUE_VISIBLE_RASTER_ATTRIBUTES: "imgQuery:getUniqueVisibleRasterFields",
                            //get unique field values for results in the grid
                            GET_UNIQUE_VISIBLE_ROW_ATTRIBUTES: "imgQuery:getUniqueVisibleRowFields",
                            //perform a dojo store query on the backing store for the result grid
                            QUERY_RESULT_SET: "imgQuery:queryResultSet",
                            //when fired will gray out results that pass the validation of the passed function
                            GRAY_OUT_RESULTS_BY_FUNCTION: "imgQuery:grayByFunction",
                            //clear all grayed out results in the map
                            CLEAR_GRAYED_OUT_RESULTS: "imgQuery:clearGrayedOutResults",
                            //disables the thumbnail checkboxes in the grid
                            DISABLE_THUMBNAIL_CHECKBOXES: "imgQuery:disableFootprintCheckboxes",
                            //enable the thumbnail checkboxes in the grid
                            ENABLE_THUMBNAIL_CHECKBOXES: "imgQuery:enableFootprintCheckboxes",

                            //get the the count of visible grid results
                            GET_VISIBLE_GRID_RESULT_COUNT: "imgQuery:visGrRsCnt",
                            //fired when the result grid has been populated with results
                            RESULT_GRID_POPULATED: "imgQuery:rsGrPopulated",
                            GET_VISIBLE_FOOTPRINT_GEOMETRIES: "imgQuery:getVsFtPtGeoms",
                            GET_VISIBLE_FOOTPRINT_FEATURES: "imgQuery:getVsFtPtFeatures",
                            GET_VISIBLE_FOOTPRINT_FEATURES_GROUPED_BY_QUERY_CONTROLLER: "imgQuery:getVsFtPtFeaturesByQueryCont"
                        },
                        THUMBNAIL: {
                            SHOW: "thumbnail:show",
                            CLEAR: "thumbnail:clear",
                            RELOAD: "thumbnail:reload"
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
                        GET_ADDED_OBJECT_IDS_FOR_QUERY_CONTROLLER: "cart:gAddedObjIdsForQueryController",
                        DISPLAYED: "cart:displayed",
                        HIDDEN: "cart:hidden",
                        IS_VISIBLE: "cart:isVisible",
                        GET_VISIBLE_FIELD_NAMES: "cart:getVisFieldNames"
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
                        CENTER_AND_FLASH_FOOTPRINT: "lyr:centerAndFlashFtPrint",
                        REFRESH_FOOTPRINTS_LAYER: "lyr:refreshFootprintsLayer",
                        REORDER_BANDS: "lyr:reorderBands"
                    },
                    LOCK_RASTER: {
                        //    CLEAR_ALL: "lRaster:clearIds",
                        HAS_NO_SOURCES_LOCKED: "lRaster:hasNoSrcLocked",
                        HAS_SINGLE_SOURCE_LOCKED: "lRaster:hasSgleSrcLocked",
                        MULTIPLE_SOURCES_LOCKED: "lRaster:multiSrcLocked",
                        NO_SOURCES_LOCKED: "lRaster:noSrcLocked",
                        CHANGED: "lRaster:changed",
                        SINGLE_SOURCE_LOCKED: "lRaster:singleSrcLocked",
                        CLEAR_ON_EXCLUDED_QUERY_CONTROLLERS: "lRster:clearExcludeQueryConts"
                        //   CART_SOURCE_LOCKED:  "lRaster:cartSrcLocked"
                    },
                    IMAGE: {

                        TOGGLE_IMAGE_BY_QUERY_CONTROLLER: "imgInfo:toggleImgByQueryCont",
                        TOGGLE_ADD_TO_CART_BY_QUERY_CONTROLLER: "imgInfo:toggleToCartByQueryCont",
                        //***deprecated do not use*****/
                        INFO: {
                            //shows the image info window
                            SHOW: "imgInfo:show",
                            //hides the image info window
                            HIDE: "imgInfo:hide",

                            //turns on/off the image
                            TOGGLE_SHOW_IMAGE: "imgInfo:showImage",
                            //add/remove item from shopping cart
                            TOGGLE_ADD_IMAGE_TO_SHOPPING_CART: "imgInfo:toggleAddImageToShoppingCart",
                            //deprecated
                            SET_CONTENT_AND_SHOW: "imgInfo:setContentAndShow"
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
                        GET: "imgConfig:get",
                        GET_ENTRY: "imgConfig:getEntry",
                        GET_DISPLAY_FIELDS_LOOKUP: "imgConfig:getDispFieldsLookup"
                    },
                    DOWNLOAD: {
                        WINDOW: {
                            SHOW: "rptWindow:show",
                            HIDE: "rptWindow:hide",
                            TOGGLE: "rptWindow:toggle"
                        },
                        DOWNLOAD_ALL_IMAGERY: "dwn:AllImagery"
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
                                DISCOVERY_WIDGET: "place:discoveryWidg",
                                SEARCHER_WIDGET: "place:searcherWidg"
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
                },
                STORAGE: {
                    LABELS: {
                        CATALOGS: "localStorageCatalogs"
                    }
                }

            });
    });

