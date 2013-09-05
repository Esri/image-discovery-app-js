###Discovery Viewer Configurations###

There are two main configuration files that allow users to customize/configure important properties of the viewer application, such as which widgets to include in the viewer, which image services will be searched, which fields will be displayed in the search results, etc. 

####`config/imagery/imageryConfig.json`####
This file defines general configuration properties of the viewer application.  

- `windowTitle`

		"windowTitle": "Image Discovery"

	Title of the application; this will appear at the top of the browser window. 

- `portal`
	
		"portal": {
			"url": "http://www.arcgis.com"
		}
	
	The viewer application has a number of widgets that are capable of interacting with Portal for ArcGIS, such as searching for items and publishing items to Portal. This property defines the Portal instance that will be used by the viewer application.

- `map`  	
	- `initializationParameters`: Object containing entries to pass to the options of the esri/Map constructor
	- `useBasemapGallery`: whether to use the out-of-the-box Esri basemap gallery.
	- `initialExtent`: _optional_, the initial extent of the map when the viewer application launches
	- `basemaps`: defines a list of base maps available in the viewer for the user to chooose from; this property is ignored if `useBasemapGallery` is `true`
	- `legend`: defines whether a legend is to be displayed
	- `overview`: defines whether an overview map is to be displayed 

	supported operational layer types: "feature" , "dynamic", "tiled","image", "kml" 

			"map": {
		        "initializationParameters": {
		            "wrapAround180": true,
		            "force3DTransforms": false,
		            "navigationMode": "classic",
		            "logo": false
		        },
		        "useBasemapGallery": true,
		        "initialExtent": {
		            "xmin": -8847249.936968341,
		            "ymin": 3933736.784368135,
		            "xmax": -8651571.144558214,
		            "ymax": 4070100.442828942,
		            "spatialReference": {
		                "wkid": 102100
		            }
		        },
		        "basemaps": {
		            "topo": {
		                "label": "World Topographic",
		                "icon": "./images/thumbs/worldTopo.png",
		                "url": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/"
		            },
		        },
		        "operationalLayers": [
					 {
			            "type": "feature",
			            "url": "http://myserver/arcgis/rest/services/LiDARManagement/Anno/FeatureServer/0",
			            "visibleLayerIds": [0, 1, 2], //optional
			            "visible": true //optional
			          }
		
		        ],
		        "referenceLayers": [
		            {
		                "type": "dynamic",
		                "url": "//server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer"
		            }
		        ],
		        "legend": {
		            "create": false
		        },
		        "overview": {
		            "create": false
		        }
	    	}

- `geometryServiceUrl`
	
	Defines the geometry service that will be used by the viewer application.

		 "geometryServiceUrl": "http://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer"
 
- `locators`

	Array of objects containing a url to an ArcGIS Server geocode service

		 "locators": [
	        {
	            "url": "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
	        }
    	] 

- `header`
	- `display`: whether a header will be displayed in the viewer
	- `headerText`: text that will appear in the header
	- `headerImage`: image that will appear in the header
	- `contact`: contact information that will appear in the header
	- `help`: help information that will appear in the header
	
			"header": {
		        "display": true,
		        "headerText": "Discovery Application",
		        "headerImage": "images/esriLogo.png",
		        "contact": {
		            "label": "Contact Us",
		            "url": "http://www.esri.com"
		        },
		        "help": {
		            "label": "Help",
		            "url": "http://www.esri.com"
		        }
	    	}

- `toolsBar`
	
	Contains entries that allow hide/display of toolbar entries

	- `showToolsDropdown`: boolean to show/hide the tools dropdown menu item
	- `showLayersButton`: boolean to show/hide the Layers button
	- `showConfigureLocatorsIcon`: boolean to show/hide the gear icon for selecting the search geocode service
	- `showBookmarksButton`: boolean to show/hide the bookmarks button
	- `showExtentActions`: boolean to show/hide the previous/next map extent widget

			"toolsBar": {
		        "showToolsDropdown": true,
		        "showLayersButton": true,
		        "showConfigureLocatorsIcon": false,
		        "showBookmarksButton": true,
		        "showExtentActions": false
		    }
- `bookmarks`

	allows predefined bookmarks in the viewer.

	- `url`: path to json file containing bookmark entries

	  		"bookmarks": {
	        	"url": "config/bookmarks.json"
	    	},
	

In addition to the above properties, the user can also use this file to customize which widgets to include in the viewer. Below are widgets that you can set flags to create on viewer load.  

	"portalSearchWidget": {
        "create": true
    },
    "reflectivityWidget": {
        "create": false,
        "configurationUrl": "config/widgets/ReflectivityWidgetConfig.json"
    },
    "weatherWidget": {
        "create": false,
        "configurationUrl": "config/widgets/WeatherWidgetConfig.json"
    },
    "socialMediaWidget": {
        "create": false,
        "configurationUrl": "config/widgets/SocialMediaWidgetConfig.json"
    },
    "measureWidget": {
        "create": true
    },
    "drawWidget": {
        "create": true
    },
    "swipeWidget": {
        "create": true
    },
    "layersWidget": {
        "allowAddLayers": true,
        "showWKIDInAddLayers": true
    },
 	"printWidget": {
        "create": true,
        "printTaskUrl": "http://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
    },
    "reverseGeocodeWidget": {
        "create": true
    },
    "identifyWidget": {
        "create": true
    },
    "zoomToWidget": {
        "create": true,
        "stateJson": "config/data/coordinates/states_web_merc.json",
        "countyJson": "config/data/coordinates/counties_web_merc.json"
    },
    "logging": {
        "window": {
            "create": false
        }
    },
    "plottingWidget": {
        "create": true,
        "symbolUrl": "images/symbols/plotPin.png"
    }


####`config/imagery/imageQueryConfiguration.json`####
This file defines configuration properties that are related to querying of images. 

- `imageQueryLayers`
	
	This property defines a list of ArcGIS for Server Image Services that will be searched by the discovery widget in the viewer application. Each service must have an URL, label, and an optional where clause that will be used to in all queries being sent to the service. 

	- `queryWhereClauseAppend`: a string that will be appended to every REST query to the ArcGIS Image Service. "Category = 1" will restrict results to only imagery.

		    "imageQueryLayers": [
		        {
		            "url": "http://myserver/arcgis/rest/services/NC/NAIP2010_4Band/ImageServer",
		            "label": "LiDar",
		            "queryWhereClauseAppend": "Category = 1"
		        },
		        {
		            "url": "http://imagery.arcgisonline.com/arcgis/rest/services/LandsatGLS/LandsatMaster/ImageServer",
		            "label": "LandSat",
		            "queryWhereClauseAppend": "Category = 1"
		        }
	    	],

- `imageDiscoveryQueryFields`

	This property allows you to define fields that the user can filter on before performing a search. Each entry will load into a select box of unique values that can be applied before performing a query 


	This property defines a list of fields/columns that will be included in the result set of each query. Users can add/remove fields from this list. Each field has a number of properties that can be configured:

		"imageDiscoveryQueryFields": [
	        {
	            "field": "ProductName",
	            "label": "Product"
	        }
    	]

- `imageQueryResultDisplayFields`

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

				"imageQueryResultDisplayFields": [
		        {
		            "field": "OBJECTID",
		            "label": "id",
		            "filter": {
		                "enable": false
		            },
		            "gridOptions": {
		                "hiddenOnDisplay": true
		            }
		        },
		        {
		            "field": "SensorName",
		            "label": "Sensor",
		            "filter": {
		                "enable": false
		            }
		        }

- `resultsFormatting`
	
	Defines how certain types of fields are to be displayed. 
	- `displayFormats/date`: format of date fields
	- `floatPrecision`: number of decimal places used in displaying floating point numbers

			"resultsFormatting": {
		        "displayFormats": {
		            "date": "dd-MM-yyyy"
		        },
		        "floatPrecision": 1
	    	}
	
- `discoverGeometryUploadTask`
	- `uploadURL`: REST endpoint of the upload operation of the geoprocessing task that will accept a user-defined KML, SHP, or KMZ file containing polygon geometries
	- `geoprocessingTaskUrl`: REST endpoint of the geoprocessing task used by the application to process user-defined geometries as search criteria when discovering imagery

			 "discoverGeometryUploadTask": {
		        "uploadUrl": "https://myserver/arcgis/rest/services/Tasks/DiscoveryTools/GPServer/uploads/upload",
		        "geoprocessingTaskUrl": "https://myserver/arcgis/rest/services/Tasks/DiscoveryTools/GPServer/fileToFeatures",
		        "uploadSHPFileParameterName": "uploadSHPFile",
		        "uploadKMLFileParameterName": "uploadKMLFile",
		        "uploadKMZFileParameterName": "uploadKMZFile",
		        "spatialReferenceWKIDParameterName": "env:outSR",
		        "outputFeaturesParameterName": "outFeatures",
		        "isAsync": true
	    	},

- `searchConfiguration`
	- `maxQueryResults`: maximum number of results to be retrieved from the server and displayed to the user for each query
	- `allowCheckAllSearchResultThumbnails`: ???
	- `footprintZoomLevelStart`: zoom level at which to begin displaying footprints
	- `useHeatmap`: whether to use clustering or heatmap mode for viewing large result sets on the map  

			"searchConfiguration": {
		        "maxQueryResults": 600,
		        "allowCheckAllSearchResultThumbnails": true,
		        "footprintZoomLevelStart": 9,
		        "useHeatmap": false
	
	    	},

- `exportConfiguration`

	This section defines the size of images that will be exported and the properties of the geoprocessing task that will be performing the report generation.
	- `image`
		- `height`: height in pixels of the exported image
		- `width`: width in pixels of the exported image
	- `footprints`: 
		- `task/url`: REST endpoint of the geoprocessing task that will generate the reports

				"exportConfiguration": {
			        "image": {
			            "height": 800,
			            "width": 600
			        },
			        "footprints": {
			            "task": {
			                "url": "https://myserver/arcgis/rest/services/Tasks/DiscoveryTools/GPServer/reportGenerator",
			                "featureInputParameter": "Input_JSON_String",
			                "outputUrlParameter": "Report_URL",
			                "isAsync": true
			            }
			        }
			    }
						
	 
- `reporting`
	- `html/templateURL`: HTML template file for reports

			    "reporting": {
			        "html": {
			            "templateURL": "templates/htmlReport.html"
			        }
			    }
	 
		   



	 

 




