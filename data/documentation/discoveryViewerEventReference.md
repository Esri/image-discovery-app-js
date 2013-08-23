## Discovery Viewer Events ##

* [Results](#result-events)
* [Filtering](#filtering-events)
* [Shopping Cart](#shopping-cart-events)
* [Configuration Events](#discovery-viewer-configuration-events)



All events are prefixed with: `IMAGERY_GLOBALS.EVENTS`. for example `IMAGERY_GLOBALS.EVENTS.RESULT.CLEAR`

#### Result Events
---

_Clear results_

`RESULT.CLEAR`

__Get unique attributes on visible imagery entries in the result grid__ (imagery visible on the map)

`RESULT.GET_UNIQUE_VISIBLE_RASTER_ATTRIBUTES` (fieldsArray:__Array__, callback:__Function__, queryParams:__Object__)

		fieldsArray is an array of fields to return unique values for
		queryParams (optional) is a dojo store query object that is used to add a query before retrieving unique values

_Get unique attributes on visible results in the grid_

`RESULT.GET_UNIQUE_VISIBLE_ROW_ATTRIBUTES` (fieldsArray:__Array__, callback:__Function__, queryParams:__Object__)

		fieldsArray is an array of fields to return unique values for
		queryParams (optional) is a dojo store query object that is used to add a query before retrieving unique values
_Query all search results_ (filtered results are included)

`RESULT.QUERY_RESULT_SET` (queryParams:__Object__, callback:__Function__)

		queryParams is the dojo store query to apply to the result set

_Gray out grid results_

`RESULT.GRAY_OUT_RESULTS_BY_FUNCTION` (isDisabledFunction:__Function__)

		isDisabledFunction is a method that takes in a store item and returns true if the item is to be grayed out

_Clear grayed out grid results_

`RESULT.CLEAR_GRAYED_OUT_RESULTS`

_Disable all thumbnail checkboxes_

`RESULT.DISABLE_THUMBNAIL_CHECKBOXES`

_Enable all thumbnail checkboxes_

`RESULT.ENABLE_THUMBNAIL_CHECKBOXES`

_Get visible row count in results grid_

`RESULT.GET_VISIBLE_GRID_RESULT_COUNT` (callback:__Function__)

#### Filtering Events
---

these events allow you to block/unblock the user from applying filters to the result grid

_Block user filters_

`FILTER.ADD_USER_LOCK`

_Remove user filter block_

`FILTER.REMOVE_USER_LOCK`

#### Shopping Cart Events
---

_Get Object ids of the items in the cart_

`CART.GET_ADDED_OBJECT_IDS` (callback:Function)

		returns objectIds:Array

#### Discovery Viewer Configuration Events
---
	
_Get discovery viewer configuration entry_

`CONFIGURATION.GET` (paramName:__String__ , callback:__Function__)

	paramName is an entry found in config/imagery/imageQueryConfiguration.json