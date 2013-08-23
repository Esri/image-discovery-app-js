## Discovery Viewer Events ##

All events are prefixed with: `IMAGERY_GLOBALS.EVENTS`. for example `IMAGERY_GLOBALS.EVENTS.RESULT.CLEAR`

###RESULTS###
---

__Clear results__

`RESULT.CLEAR`

__Get unique attributes on visible imagery entries in the result grid__ (imagery visible on the map)

`RESULT.GET_UNIQUE_VISIBLE_RASTER_ATTRIBUTES` (fieldsArray:__Array__, callback:__Function__, queryParams:__Object__)

		fieldsArray is an array of fields to return unique values for
		queryParams (optional) is a dojo store query object that is used to add a query before retrieving unique values

__Get unique attributes on visible results in the grid__

`RESULT.GET_UNIQUE_VISIBLE_ROW_ATTRIBUTES` (fieldsArray:__Array__, callback:__Function__, queryParams:__Object__)

		fieldsArray is an array of fields to return unique values for
		queryParams (optional) is a dojo store query object that is used to add a query before retrieving unique values
__Query all search results__ (filtered results are included)

`RESULT.QUERY_RESULT_SET` (queryParams:__Object__, callback:__Function__)

		queryParams is the dojo store query to apply to the result set

__Gray out grid results__

`RESULT.GRAY_OUT_RESULTS_BY_FUNCTION` (isDisabledFunction:__Function__)

		isDisabledFunction is a method that takes in a store item and returns true if the item is to be grayed out

__Clear grayed out grid results__

`RESULT.CLEAR_GRAYED_OUT_RESULTS`

__Disable all thumbnail checkboxes__

`RESULT.DISABLE_THUMBNAIL_CHECKBOXES`

__Enable all thumbnail checkboxes__

`RESULT.ENABLE_THUMBNAIL_CHECKBOXES`

__Get visible row count in results grid__

`RESULT.GET_VISIBLE_GRID_RESULT_COUNT` (callback:__Function__)

###Filtering###
---

these events allow you to block/unblock the user from applying filters to the result grid

__Block user filters__

`FILTER.ADD_USER_LOCK`

__Remove user filter block__

`FILTER.REMOVE_USER_LOCK`

###Shopping Cart###
---

__Get Object ids of the items in the cart__

`CART.GET_ADDED_OBJECT_IDS` (callback:Function)

		returns objectIds:Array

####Discovery Viewer Configuration####
---
	
__Get discovery viewer configuration entry__

`CONFIGURATION.GET` (paramName:__String__ , callback:__Function__)

	paramName is an entry found in config/imagery/imageQueryConfiguration.json