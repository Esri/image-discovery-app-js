
###Viewer Code Overview###

#####Loader#####

- All viewers have a “Loader” class. This is what is kicked off in the index.html that initializes the manager and common variables for the implementation
- All loaders should extend the base loader `esriviewer\loader\ViewerLoader`

#####Manager#####

- All implementations have a “Manager” class. This file reads the configuration and kicks off creating all the UI widgets.  Extending this class allows you to customize what is created in the viewer. If you want to suppress creation of any widgets this is the class where you do it.

- The base manager is `esriviewer/manager/base/ViewerManager`
 
- UI creation functions for the manager are in `esriviewer/manager/base/ViewerManagerUI`
 
- Finally, `esriviewer/manager/ViewerManagerWindow` is the class to extend. This class inherits both `ViewerManager` and `ViewerManagerUI`.

- Reference the base manager to find the function name for the functionality that you want to modify/suppress when the viewer is being created.

#####Events#####

- See `docs/baseViewerEventReference.md` for event listing and required parameters.

- Listing of all events that can be fired from custom widgets for the base viewer are found in `esriviewer\base\ViewerGlobals`
 
- To fire the events import `dojo/topic` into your class and fire the global event. Most events take in a callback that is responded to. Check the topic.subscribe for the event to see the parameters the event takes in.

 		var mapExtent; 
 		topic.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.GET_EXTENT, function (ext) {
 			mapExtent = ext;
 		});

#####Widgets#####
- There are two base classes for creating widgets
	- `esriviewer/ui/base/UIWidget`
		- `UIWidget` extends `dijit/_Widget` and adds custom functionality to the viewer widgets such as initial positioning for the widget through configuration
	- `esriviewer/ui/base/UITemplatedWidget`
	-	 `UITemplatedWidget` extends `UIWidget` and adds functionality for passing an HTML template that will be used as the DOM node for the widget
	- To import a HTML template into your widget use the `dojo/text!` plugin
		- `dojo/text!./template/CreateBookmarkTemplate.html` 
		- set the imported string as `templateString` as a member of your class

#####Configuration#####

- The `ViewerManager` class loads the viewer configuration files. 
- Configuration files are documented in `web/config/templates`. Configuration files are found in `web/config`
	
	######`ViewerPositioning.json`######

	This configuration file controls the placement of widgets in the browser. If your widget extends `UIWidget` you can position your widget through this configuration by setting `positioningParamName` in your class. For example if you set `positioningParamName` in your class to `drawWidget` and add a `drawWidget` entry to viewerPositioning.json with x and y coordinates, your widgets will be positions at these coordinates in the browser.

	######`baseConfig.json`######

	This configuration file tells the viewer which widgets to create/configure and how to create the map. This configuration file allows base maps, operational layers, reference layers, locators, and geometry service to be defined.

	######`bookmarks.json`######

	This configuration file is read for the default bookmarks that are to be created when the viewer starts up.

#####Geometry#####

If a geometry service is defined in the configuration the “GeometryServiceController” found in `esriviewer\viewer\map\geometry` can perform common geometry functions such as projecting geometry to the maps spatial reference. Geometry manipulation can be performed through events found in `baseViewerEventReference.md` geometry section.
	




