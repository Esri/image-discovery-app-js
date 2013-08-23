## Base JavaScript Viewer Events ##

All events are prefixed with: `VIEWER_GLOBALS.EVENTS`. for example: `VIEWER_GLOBALS.EVENTS.LOCATOR. REVERSE_GEOCODE`


### Mapping Events ###
---
Mapping events allow you to retrieve an instance of the map and also interact with the map.

__Get the map instance__

`MAP.GET` (callback:__Function__)

	returns map:Map

__Get the map div__

`MAP.GET_MAP_DIV` (callback:__Function__)

	returns div:DOMElement

__Pan the map__

`MAP.EXTENT.PAN_TO` (point:__Point__, options:__Object__)

	options: {zoomTo:Boolean, deepest:Boolean, zoomLevel:uint}

__Get the center point of the map__

`MAP.EXTENT.GET_CENTER` (callback:__Function__)
	
	returns point:Point

__Get map extent__

`MAP.EXTENT.GET_EXTENT` (callback:__Function__)

	returns callback:Function

__Set the map extent__

`MAP.EXTENT.SET_EXTENT` (extent:__Extent__)

__Get map zoom level__

`MAP.EXTENT.GET_LEVEL` (callback:__Function__)

	returns level:int

__Set map zoom level__

`MAP.EXTENT.SET_LEVEL` (level:__uint__)

__Get map dimensions__

`MAP.DIMENSIONS.GET` (callback:__Function__)

	returns dimensions:Object

### Location Events ###
---

Provides geocoding functionality. There must be a geocoder available for these events.


__Perform a reverse geocode__

`LOCATOR.REVERSE_GEOCODE` (ptGeometry:__Point__ , distanceInMeters:__uint__ , callback:__Function__, errback:__Function__)

	returns candidate:AddressCandidate

__Add a locator__

`LOCATOR.ADD_LOCATOR` (locatorUrl:__String__ , callback:__Function__ , errback:__Function__)

	returns locatorId:String

__Remove a locator__

`LOCATOR.REMOVE_LOCATOR` (locatorId:__String__) - a locator id is returned from `LOCATOR.ADD_LOCATOR`

	after removal LOCATOR.LOCATOR_REMOVED is fired

__Get all configured locators__

`LOCATOR.GET_LOCATORS` (callback:__Function__)

	returns locators:Array<Locator>

### Layers ###
---

__Perform a layer query__

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

__Add a graphics layer__

`MAP.LAYERS.ADD_GRAPHICS_LAYER` (layer:__GraphicsLayer__)

__Show the configured label services__

`MAP.LABEL_SERVICES.SHOW`

__Hide the configured label services__

`MAP.LABEL_SERVICES.HIDE`

__Check if label services exist__

`MAP.LABEL_SERVICES.SERVICE_EXISTS` (callback:__Function__)

	returns labelsExist:Boolean

__Get time enabled services__

`MAP.TIME.GET_TIME_ENABLED_SERVICES` (callback:__Function__)

	returns layers:Array<Layer>

__Get all operational layers__

`MAP.LAYERS.OPERATIONAL.GET` (callback:__Function__)

	returns layers:Array<Layer>

__Add a layer to the map from URL__

`MAP.LAYERS.ADD_FROM_URL` (	layerUrl:__String__ , options:__Object__ , callback:__Function__ , errback:__Function__)

		options: {
			canRemove:Boolean,
			isOperationalLayer:Boolean,
			label:String
		}

__Add a layer to the map__

`MAP.LAYERS.ADD` (layer:__Layer__ , options:__Object__ , callback:__Function__ , errback:__Function__)

		options: {
			canRemove:Boolean,
			isOperationalLayer:Boolean,
			label:String
		}

__Add a layer to the map that is not managed by the viewer__ *not added to TOC or returned from layer queries

`MAP.LAYERS.ADD_EXTERNAL_MANAGED_LAYER` (layer:__Layer__)

__Remove an externally managed layer__

`MAP.LAYERS.REMOVE_EXTERNAL_MANAGED_LAYER` (layer:__Layer__)

__Remove a layer__ *Layer is removed from TOC and operational layers array

`MAP.LAYERS.REMOVE` (layer:__Layer__)

__Add a reference layer to the configured reference layers__

`MAP.LAYERS.ADD_REFERENCE_LAYER` (referenceLayerConfig:__Object__ , callback:__Function__ ,errback:__Function__)

	referenceLayerConfig: {
		url:String,
		type:String (tiled,dynamic,image,feature),
		visibleLayerIds:Array	
	}

__Remove a reference layer__

`MAP.LAYERS.REMOVE_REFERENCE_LAYER` (layer:__Layer__)

__Move a layer to the top of the map__

`MAP.LAYERS.MOVE_LAYER_TO_TOP` (layer:__Layer__)

###Base Map###
---

__Set the current base map__

`MAP.BASEMAP.SET` (id:__String__)

	id parameter is returned from MAP.BASEMAP.ADD

__Add a base map__

`MAP.BASEMAP.ADD` (url:__String__ , callback:__Function__ , errback:__Function__)

	returns basemap object with assigned “id” attribute

__Get current base map URL__

`MAP.BASEMAP.GET_CURRENT_URL` (callback:__Function__)

	returns basemapUrl:String

__Get current base map__

`MAP.BASEMAP.GET_CURRENT` (callback:__Function__)

	returns layer:Layer

###Annotations###
---

__Add a graphic to the map__

`MAP.GRAPHICS.ADD` (graphic:__Graphic__)

__Remove a map graphic__

`MAP.GRAPHICS.REMOVE` (graphic:__Graphic__)

__Center and flash a graphic__

`MAP.GRAPHICS.CENTER_AND_FLASH` (graphic:__Graphic__)

__Flash point graphic__

`MAP.FLASH.POINT` (pt:__Graphic__ , delay:__uint__)

###Drawing###
---

All draw events accept an options parameter

	options: { cursor: “crosshair”, showTooltips:Boolean, tooltipOffset:int}	

All drawing events return the associated geometry from the draw operation

__Enable rectangle draw__

`DRAW.USER.RECTANGLE_INPUT` (callback:__Function__ , options:__Object__)

__Enable polyline draw__

`DRAW.USER.POLYLINE_INPUT` (callback:__Function__ , options:__Object__)

__Enable line draw__

`DRAW.USER.LINE_INPUT` (callback:__Function__ , options:__Object__)

__Enable point draw__

`DRAW.USER.POINT_INPUT` (callback:__Function__ , options:__Object__)

__Enable polygon draw__

`DRAW.USER.POLYGON_INPUT` (callback:__Function__ , options:__Object__)

__Enable freehand polyline draw__

`DRAW.USER.FREEHAND_POLYLINE_INPUT` (callback:__Function__ , options:__Object__)

__Enable freehand polygon draw__

`DRAW.USER.FREEHAND_POLYGON_INPUT` (callback:__Function__ , options:__Object__)

__Cancel and in-flight map drawing operations__

`DRAW.USER.DRAW_CANCEL`

###Projection/Geometry###
---
Projection events require a configuration geometry service

__Check if there is a configured geometry service__

`GEOMETRY_SERVICE.EXISTS` (callback:__Function__)

	returns serviceExists:Boolean

__Project geometries to lat/lon___

`GEOMETRY_SERVICE.TASKS.PROJECT_TO_LAT_LON` (goemetries:__Array__, callback:__Function__)

	returns geometries:Array<Geometry>

__Convert MGRS string to lat/lon__

`GEOMETRY_SERVICE.MGRS_TO_LAT_LON` (mgrs:__String__ , callback:__Function__)

	returns geometry:Geometry

__Convert geometries to map spatial reference__

`GEOMETRY_SERVICE.TASKS.PROJECT_TO_MAP_SR` (geometries:__Array__ , callback:__Function__ , options:__Object__ , errback:__Function__)

	options: {transformation: {wkid: 4326}}

	returns geometries:Array<Geometry>

__Calculate the area of a polygon__

`GEOMETRY_SERVICE.TASKS.CALCULATE_AREA` (polygon:Polygon, units:__esri/tasks/GeometryServiceUnt__ , callback:__Function__)

	returns  { areas:Number[], lengths:Number[] }.

__Calculate distance of a line__

`GEOMETRY_SERVICE.TASKS.CALCULATE_DISTANCE` (polyline:__Polyline__  , units:__esri/tasks/GeometryServiceUnt__ , callback:__Function__) 

	returns {lengths:Number[]}

__Buffer a point__

`GEOMETRY_SERVICE.BUFFER_POINT` (point:__Point__ , distanceAndUnits:__Object__ , callback:__Function__ , errback:__Function__) 

	distanceAndUnitsObj = {
			distance: 10,
			units: esri/tasks/GeometryService.UNIT_KILOMETER
	}

<a id="portal"></a>
###Portal Support###
---

__Search Map Services__

`PORTAL.SEARCH_MAP_SERVICES` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 

__Search Web Maps__

`PORTAL.SEARCH_WEBMAPS` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 

__Search Geocode services__

`PORTAL.SEARCH_GEOCODE_SERVICES` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 

__Search Image Services__

`PORTAL.SEARCH_IMAGE_SERVICES` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 	


__Search Feature Service Layers__

`PORTAL.SEARCH_FEATURE_SERVICE_LAYERS` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 
	
__Search Feature Services__

`PORTAL.SEARCH_FEATURE_SERVICES` (queryString:__String__, maxResults: __uint__ , sortField:__String__, startIdx:__int__ , callback:__Function__ , errback:__Function__)

	returns portalResponse:Array<PortalItem> 

__Get portal instance__

`PORTAL.GET_INSTANCE` (callback:__Function__)

	returns portal:Portal

__Log into portal__

`PORTAL.LOG_IN` (callback:Function)

	returns user:PortalUser

__Log out of portal__

`PORTAL.LOG_OUT`

__Check is user is logged into portal__

`PORTAL.IS_USER_LOGGED_IN` (callback:__Function__)

	returns loggedIn:Boolean

###Configuration###
---
configuration events allow code to retrieve entries found in the map configuration json file

__Get a configuration entry__

`CONFIGURATION.GET_ENTRY` (paramName:__String__ , callback:__Function__)

	returns configuration:Object


__Get the full configuration object__

`CONFIGURATION.GET` (callback:__Function__)

	returns configuration:Object

###Tools###
---

__Add tool to tools dropdown__

`TOOLS.MENU.ADD_TOOL` (menuItem:__MenuItem__)



###Windows###
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
	

