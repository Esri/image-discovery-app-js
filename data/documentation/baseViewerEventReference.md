## Base JavaScript Viewer Events


* [Mapping](#mapping-events)
* [Location](#location-events)
* [Layers](#layer-events)
* [Base Map](#base-map-events)
* [Annotations](#annotations)
* [Drawing](#drawing-events)
* [Projection/Geometry](#projection-and-geometry-events)
* [Portal](#portal-events)
* [Configuration](#configuration-events)
* [Tools](#tools)
* [Windows](#windows)



All events are prefixed with: `VIEWER_GLOBALS.EVENTS`. for example: `VIEWER_GLOBALS.EVENTS.LOCATOR. REVERSE_GEOCODE`


#### Mapping Events
---
Mapping events allow you to retrieve an instance of the map and also interact with the map.

_Get the map instance_

`MAP.GET` (callback:__Function__)

	returns map:Map

_Get the map div_

`MAP.GET_MAP_DIV` (callback:__Function__)

	returns div:DOMElement

_Pan the map_

`MAP.EXTENT.PAN_TO` (point:__Point__, options:__Object__)

	options: {zoomTo:Boolean, deepest:Boolean, zoomLevel:uint}

_Get the center point of the map_

`MAP.EXTENT.GET_CENTER` (callback:__Function__)
	
	returns point:Point

_Get map extent_

`MAP.EXTENT.GET_EXTENT` (callback:__Function__)

	returns callback:Function

_Set the map extent_

`MAP.EXTENT.SET_EXTENT` (extent:__Extent__)

_Get map zoom level_

`MAP.EXTENT.GET_LEVEL` (callback:__Function__)

	returns level:int

_Set map zoom level_

`MAP.EXTENT.SET_LEVEL` (level:__uint__)

_Get map dimensions_

`MAP.DIMENSIONS.GET` (callback:__Function__)

	returns dimensions:Object

#### Location Events
---

Provides geocoding functionality. There must be a geocoder available for these events.


_Perform a reverse geocode_

`LOCATOR.REVERSE_GEOCODE` (ptGeometry:__Point__ , distanceInMeters:__uint__ , callback:__Function__, errback:__Function__)

	returns candidate:AddressCandidate

_Add a locator_

`LOCATOR.ADD_LOCATOR` (locatorUrl:__String__ , callback:__Function__ , errback:__Function__)

	returns locatorId:String

_Remove a locator_

`LOCATOR.REMOVE_LOCATOR` (locatorId:__String__) - a locator id is returned from `LOCATOR.ADD_LOCATOR`

	after removal LOCATOR.LOCATOR_REMOVED is fired

_Get all configured locators_

`LOCATOR.GET_LOCATORS` (callback:__Function__)

	returns locators:Array<Locator>

#### Layer Events
---

_Perform a layer query_

`MAP.LAYERS.QUERY_LAYER` (layerQueryParameters:__esriviewer/map/base/LayerQueryParameters__)

	new LayerQueryParameters({
                        whereClause: "",
                        layer: Layer,
                        layerId: layerId,
                        returnGeometry: false,
                        outFields: ["*"],
                        geometry: geometry,
                        callback: callbackFunction,
                        errback: errbackFunction
                    });

_Add a graphics layer_

`MAP.LAYERS.ADD_GRAPHICS_LAYER` (layer:__GraphicsLayer__)

_Show the configured label services_

`MAP.LABEL_SERVICES.SHOW`

_Hide the configured label services_

`MAP.LABEL_SERVICES.HIDE`

_Check if label services exist_

`MAP.LABEL_SERVICES.SERVICE_EXISTS` (callback:__Function__)

	returns labelsExist:Boolean

_Get time enabled services_

`MAP.TIME.GET_TIME_ENABLED_SERVICES` (callback:__Function__)

	returns layers:Array<Layer>

_Get all operational layers_

`MAP.LAYERS.OPERATIONAL.GET` (callback:__Function__)

	returns layers:Array<Layer>

_Add a layer to the map from URL_

`MAP.LAYERS.ADD_FROM_URL` (	layerUrl:__String__ , options:__Object__ , callback:__Function__ , errback:__Function__)

		options: {
			canRemove:Boolean,
			isOperationalLayer:Boolean,
			label:String
		}

_Add a layer to the map_

`MAP.LAYERS.ADD` (layer:__Layer__ , options:__Object__ , callback:__Function__ , errback:__Function__)

		options: {
			canRemove:Boolean,
			isOperationalLayer:Boolean,
			label:String
		}

_Add a layer to the map that is not managed by the viewer_ *not added to TOC or returned from layer queries

`MAP.LAYERS.ADD_EXTERNAL_MANAGED_LAYER` (layer:__Layer__)

_Remove an externally managed layer_

`MAP.LAYERS.REMOVE_EXTERNAL_MANAGED_LAYER` (layer:__Layer__)

_Remove a layer_ *Layer is removed from TOC and operational layers array

`MAP.LAYERS.REMOVE` (layer:__Layer__)

_Add a reference layer to the configured reference layers_

`MAP.LAYERS.ADD_REFERENCE_LAYER` (referenceLayerConfig:__Object__ , callback:__Function__ ,errback:__Function__)

	referenceLayerConfig: {
		url:String,
		type:String (tiled,dynamic,image,feature),
		visibleLayerIds:Array	
	}

_Remove a reference layer_

`MAP.LAYERS.REMOVE_REFERENCE_LAYER` (layer:__Layer__)

_Move a layer to the top of the map_

`MAP.LAYERS.MOVE_LAYER_TO_TOP` (layer:__Layer__)

#### Base Map Events
---

__Set the current base map__

`MAP.BASEMAP.SET` (id:__String__)

	id parameter is returned from MAP.BASEMAP.ADD

_Add a base map_

`MAP.BASEMAP.ADD` (url:__String__ , callback:__Function__ , errback:__Function__)

	returns basemap object with assigned “id” attribute

_Get current base map URL_

`MAP.BASEMAP.GET_CURRENT_URL` (callback:__Function__)

	returns basemapUrl:String

_Get current base map_

`MAP.BASEMAP.GET_CURRENT` (callback:__Function__)

	returns layer:Layer

###Annotations###
---

_Add a graphic to the map_

`MAP.GRAPHICS.ADD` (graphic:__Graphic__)

_Remove a map graphic_

`MAP.GRAPHICS.REMOVE` (graphic:__Graphic__)

_Center and flash a graphic_

`MAP.GRAPHICS.CENTER_AND_FLASH` (graphic:__Graphic__)

_Flash point graphic_

`MAP.FLASH.POINT` (pt:__Graphic__ , delay:__uint__)

#### Drawing Events
---

All draw events accept an options parameter

	options: { cursor: “crosshair”, showTooltips:Boolean, tooltipOffset:int}	

All drawing events return the associated geometry from the draw operation

_Enable rectangle draw_

`DRAW.USER.RECTANGLE_INPUT` (callback:__Function__ , options:__Object__)

_Enable polyline draw_

`DRAW.USER.POLYLINE_INPUT` (callback:__Function__ , options:__Object__)

_Enable line draw_

`DRAW.USER.LINE_INPUT` (callback:__Function__ , options:__Object__)

_Enable point draw_

`DRAW.USER.POINT_INPUT` (callback:__Function__ , options:__Object__)

_Enable polygon draw_

`DRAW.USER.POLYGON_INPUT` (callback:__Function__ , options:__Object__)

_Enable freehand polyline draw_

`DRAW.USER.FREEHAND_POLYLINE_INPUT` (callback:__Function__ , options:__Object__)

_Enable freehand polygon draw_

`DRAW.USER.FREEHAND_POLYGON_INPUT` (callback:__Function__ , options:__Object__)

_Cancel and in-flight map drawing operations_

`DRAW.USER.DRAW_CANCEL`

#### Projection And Geometry Events
---
Projection events require a configuration geometry service

_Check if there is a configured geometry service_

`GEOMETRY_SERVICE.EXISTS` (callback:__Function__)

	returns serviceExists:Boolean

_Project geometries to lat/lon__

`GEOMETRY_SERVICE.TASKS.PROJECT_TO_LAT_LON` (goemetries:__Array__, callback:__Function__)

	returns geometries:Array<Geometry>

_Convert MGRS string to lat/lon_

`GEOMETRY_SERVICE.MGRS_TO_LAT_LON` (mgrs:__String__ , callback:__Function__)

	returns geometry:Geometry

_Convert geometries to map spatial reference_

`GEOMETRY_SERVICE.TASKS.PROJECT_TO_MAP_SR` (geometries:__Array__ , callback:__Function__ , options:__Object__ , errback:__Function__)

	options: {transformation: {wkid: 4326}}

	returns geometries:Array<Geometry>

_Calculate the area of a polygon_

`GEOMETRY_SERVICE.TASKS.CALCULATE_AREA` (polygon:Polygon, units:__esri/tasks/GeometryServiceUnt__ , callback:__Function__)

	returns  { areas:Number[], lengths:Number[] }.

_Calculate distance of a line_

`GEOMETRY_SERVICE.TASKS.CALCULATE_DISTANCE` (polyline:__Polyline__  , units:__esri/tasks/GeometryServiceUnt__ , callback:__Function__) 

	returns {lengths:Number[]}

_Buffer a point_

`GEOMETRY_SERVICE.BUFFER_POINT` (point:__Point__ , distanceAndUnits:__Object__ , callback:__Function__ , errback:__Function__) 

	distanceAndUnitsObj = {
			distance: 10,
			units: esri/tasks/GeometryService.UNIT_KILOMETER
	}

#### Portal Events
---

_Search Map Services_

`PORTAL.SEARCH_MAP_SERVICES` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 

_Search Web Maps_

`PORTAL.SEARCH_WEBMAPS` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 

_Search Geocode services_

`PORTAL.SEARCH_GEOCODE_SERVICES` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 

_Search Image Services_

`PORTAL.SEARCH_IMAGE_SERVICES` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 	


_Search Feature Service Layers_

`PORTAL.SEARCH_FEATURE_SERVICE_LAYERS` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 
	
_Search Feature Services_

`PORTAL.SEARCH_FEATURE_SERVICES` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 

_Get portal instance_

`PORTAL.GET_INSTANCE` (callback:__Function__)

	returns portal:Portal

_Log into portal_

`PORTAL.LOG_IN` (callback:Function)

	returns user:PortalUser

_Log out of portal_

`PORTAL.LOG_OUT`

_Check is user is logged into portal_

`PORTAL.IS_USER_LOGGED_IN` (callback:__Function__)

	returns loggedIn:Boolean

#### Configuration Events
---
configuration events allow code to retrieve entries found in the map configuration json file.

_Get a configuration entry_

`CONFIGURATION.GET_ENTRY` (paramName:__String__ , callback:__Function__)

	returns configuration:Object


_Get the full configuration object_

`CONFIGURATION.GET` (callback:__Function__)

	returns configuration:Object

#### Tools
---

_Add tool to tools dropdown_

`TOOLS.MENU.ADD_TOOL` (menuItem:__MenuItem__)



#### Windows
---
all windows support show/hide/toggle `WINDOW.WEATHER.SHOW` `WINDOW.WEATHER.HIDE` `WINDOW.WEATHER.TOGGLE` 

Available windows:

- WEATHER
- SOCIAL_MEDIA
- DRAW
- LEGEND
- QUERY_BUILDER
- FEATURE_EDITOR
- MEASURE
- IDENTIFY
- REVERSE_GEOCODE (find address)
- ZOOM_TO
- REFLECTIVITY
- PRINT
- PLOTTING
	

