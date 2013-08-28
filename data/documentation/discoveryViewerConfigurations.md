###Discovery Viewer Configurations###

There are two main configuration files that allow users to customize/configure important properties of the viewer application, such as which widgets to include in the viewer, which image services will be searched, which fields will be displayed in the search results, etc. 

####`imageConfig.json`####
This file defines general configuration properties of the viewer application.  

- `windowTitle`

	Title of the application; this will appear at the top of the browser window. 

- `portal/url`
	
	The viewer application has a number of widgets that are capable of interacting with Portal for ArcGIS, such as searching for items and publishing items to Portal. This property defines the Portal instance that will be used by the viewer application.

- `map`  	
	- `useBasemapGallery`: whether to use the out-of-the-box Esri basemap gallery 
	- `initialExtent`: the initial extent of the map when the viewer application launches
	- `basemaps`: defines a list of base maps available in the viewer for the user to chooose from; this property is ignored if `useBasemapGallery` is false
	- `legend`: defines whether a legend is to be displayed
	- `overview`: defines whether an overview map is to be displayed 

- `geometryServiceUrl`
	
	Defines the geometry service that will be used by the viewer application.
 
- `locators`	
	- `url`: REST endpoint of the geocoding service that will be used by the viewer application.  

- `header`
	- `display`: whether a header will be displayed in the viewer
	- `headerText`: text that will appear in the header
	- `headerImage`: image that will appear in the header
	- `contact`: contact information that will appear in the header
	- `help`: help information that will appear in the header

In addition to the above properties, the user can also use this file to customize which widgets to include in the viewer. Examples include the `portalSearchWidget`, `measureWidget`, `swipeWidget`, etc.   


####`imageQueryConfiguration.json`####
This file defines configuration properties that are related to querying of images. 

- `imageQueryLayers`
	
	This property defines a list of ArcGIS for Server Image Services that will be searched by the discovery widget in the viewer application. Each service must have an URL, label, and an optional where clause that will be used to in all queries being sent to the service. 

- `imageDiscoveryQueryFields`

	This property defines ...??? 

- `imageQueryResultDisplayFields`

	This property defines a list of fields/columns that will be included in the result set of each query. Users can add/remove fields from this list. Each field has a number of properties that can be configured:

	- `field`: true name of the field as it is in its data source 
	- `label`: name under which the field is to appear in the result grid
	- `filter`: 
		- `enable`: whether filtering is to be allowed for the particular field
		- `unitsLabel`: label for the units used in the field
	- `gridOptions`: 
		- `canHide`: whether the field can be hidden if desired by the user
		- `hiddenOnDisplay`: whether the field is hidden by default
	- `style`: 
		- `color`: text color of the field; e.g., red
		- `fontFace`: font of the field text; e.g., italic
		- `fontWeight`: weight of the field text; e.g., bold 
- `resultsFormatting`
	
	Defines how certain types of fields are to be displayed. 
	- `displayFormats/date`: format of date fields
	- `floatPrecision`: number of decimal places used in displaying floating point numbers
	
- `discoverGeometryUploadTask`
	- `uploadURL`: REST endpoint of the upload operation of the geoprocessing task that will accept a user-defined KML, SHP, or KMZ file containing polygon geometries
	- `geoprocessingTaskUrl`: REST endpoint of the geoprocessing task used by the application to process user-defined geometries as search criteria when discovering imagery

- `searchConfiguration`
	- `maxQueryResults`: maximum number of results to be retrieved from the server and displayed to the user for each query
	- `allowCheckAllSearchResultThumbnails`: ???
	- `footprintZoomLevelStart`: zoom level at which to begin displaying footprints
	- `useHeatmap`: whether to use clustering or heatmap mode for viewing large result sets on the map  

- `exportConfiguration`

	This section defines the size of images that will be exported and the properties of the geoprocessing task that will be performing the report generation.
	- `image`
		- `height`: height in pixels of the exported image
		- `width`: width in pixels of the exported image
	- `footprints`: 
		- `task/url`: REST endpoint of the geoprocessing task that will generate the reports
			
	 
- `reporting`
	- `html/templateURL`: HTML template file for reports
	 
		   



	 

 




