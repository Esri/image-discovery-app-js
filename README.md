# image-discovery-app-js

The Image Discovery Application enables users to search,discover,filter, and manipulate imagery through an easy to use web application. Multiple ArcGIS Server Image Services can be added to the Image Discovery Application for quick search and discovery. The Image Discovery Application supports full configuration of result fields,result styling, map display, operational layers. and reference layers.



![App](https://raw.github.com/Esri/text-and-legend-map-storytelling-template-js/master/images/storytelling-text-and-legend-map-template-js.png)

## Features
* Supports Multiple Image Service Search
* Search by: Map Extent, Point(buffer), Rectangle, Coordinates, KML/KMZ/SHP polygon upload
* Configurable result Fields
* Filter results from fields
* Imagery result manipulation (Raster Functions,Band Reordering)
* Supports time enabled maps.
* Export results to Web Map,HTML,Shapefile,KML,CSV
* Identify Results by point/rectangle
* Choose widgets you want to enable in your Image Discovery Application


##Widgets
* Bookmarking
* Basemaps
* Drawing
* Reverse Geocode
* Identify
* Operational Layer Table of Contents
* ArcGIS Portal Search
* Measure
* Legend
* Social Media (Flickr, YouTube, Twitter)
* Time Slider
* Weather Conditions
* Zoom To (USA)
* Raster Function/Band Reordering/Mensuration
* Swipe

## Instructions

1. [Install the web application](#install-the-web-application)
2. [Configure the application](#configure-the-application)
3. [Personalize the application](#personalize-the-application)

#### Install the web application

These instructions assume that you have a Web server like [Internet Information Services(IIS)](http://www.iis.net/) installed and setup on your machine. If you are using another Web server the general installation steps will be the same but you will need to check your Web server's documentation for specific information on deploying and testing the application.

1. Copy the contents of the zip file into your web server's root directory. In IIS, the default location for the web server's root folder is `c:\inetpub\wwwroot`
2. In IIS, convert the folder to a "Web Application" and add .json (application/json) MIME type
3. (Optional). If your application edits features in a feature service or generates requests that exceed 2000 characters you may need to setup and use a proxy page. Common situations where you may exceed the URL length are, using complext polygons as input to a task or specifying a spatial reference using well-known text (wkt). View the [Using the proxy page](http://help.arcgis.com/en/webapi/javascript/arcgis/jshelp/#ags_proxy) help topic for details on installing and configuring a proxy page.
4. Test the page using the following URL: http://localhost/[DiscoveryApplicationPath]/index.html, where [DiscoveryApplicationPath] is the name of the folder where you extracted the zip contents.
5. For Shapefile/KML/KMZ polygon search support, fileToFeatures.gpk located in geoprocessing\discoveryGeometryUpload\release must be deployed to an ArcGIS Server instance. Upload must be enabled when publishing the geoprocessing service.
6. Shapefile/KML/CSV reporting, reportGenerator.gpk located in geoprocessing\reporting\release must be deployed to an ArcGIS Server instance.

#### Configure the application

Now let's configure the application to point to an Search Image Service and set the result fields to display.

1. Open `web\config\imagery\imageQueryConfiguration.json` in a text editor
2. In the entry imageQueryLayers, set the URL to an ArcGIS Server Image Service endpoint.
3. Set the label parameter for your ArcGIS ServerImage Service 
4. In the entry imageQueryResultDisplayFields, set the result fields you would like to display in your result grid.
    - **field**: the field name to display
    - **label**: the label of the field to display in the result grid
    - **filter**: set enable to true if you would like to allow filtering on this result field
    - **gridOptions**: setting hiddenOnDisplay to true will require the user to enable the field for it to be visible in the result grid. canHide to true allows the user to hide the field.
    - **style**: object containing camel case CSS for how to style the field in the result grid

5. If you deployed the fileToFeatures.gpk from step 5 in "Install the web application" set the URL of the GPServer in the "discoverGeometryUploadTask" configuration entry
    - **uploadUrl**: URL to upload endpoint of the GPServer http://YOUR_SERVER/arcgis/rest/services/DiscoveryViewerTools/GPServer/uploads/upload
    - **geoprocessingTaskUrl**: URL to the GPServer endpoint http://YOUR_SERVER/arcgis/rest/services/DiscoveryViewerTools/GPServer/FileToFeatures


6. If you deployed the reportGenerator.gpk from step 6 in "Install the web application" set the URL of the GPServer in the "footprints" configuration entry
    - **url**: URL to the GPServer endpoint http://YOUR_SERVER/arcgis/rest/services/DiscoveryViewerTools/GPServer/reportGenerator



7. Save the file then test your application. Results should display from your Image Service, displaying the result fields defined in imageQueryResultDisplayFields.

#### Personalize the application

You can personalize the Image Discovery Application by adding/removing widgets, setting operational layers, and customizing the map

1. Open `web\config\imagery\imageryConfig.json` in a text editor
2. All widgets have a "create" entry. Set "create" to true to enable the widget in the Image Discovery Application.

    The social media widget requires an API key to Flickr. You can set your API key in `web\config\widgets\SocialMediaWidgetConfig.json` by replacing "<YOUR_FLICKR_API_KEY_HERE>" with your Flickr API key.

    The weather widget requires an API key to wunderground. You can set your API key in `web\config\widgets\WeatherWidgetConfig.json` by replacing "<YOUR_WUNDERGROUND_API_KEY>" with your Wunderground API key.

3. the "map" entry allows you to customize how the map is loaded. 
   - **initializationParameters**: This entry allows you to forward all the options supported by esri.Map to the map creation logic.
   - **useBasemapGallery**: when true the Image Discovery Application will use the ArcGIS Online Basemap Gallery. When false you can specify base maps in the "basemaps" configuration entry
   - **initialExtent**: The initial extent of the map on load
   - **operationalLayers**: An Array of layer objects that will be displayed in the applications table of contents
4. the "header" entry allows you to customize the logo/text/help/contact header display in the viewer.
5. the "bookmarks" entry allows you to point to a JSON file for preloaded bookmarks on application load. see web\config\bookmarks.json for the bookmark format


## Requirements

* Notepad or HTML editor
* A little background with HTML/CSS/Javascript
* Experience with the [ArcGIS Javascript API](http://links.esri.com/javascript) would help.

## Resources

* [ArcGIS for JavaScript API Resource Center](http://help.arcgis.com/en/webapi/javascript/arcgis/index.html)
* [ArcGIS Blog](http://blogs.esri.com/esri/arcgis/)

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Anyone and everyone is welcome to contribute.

## Licensing
Copyright 2013 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt](https://raw.github.com/ArcGIS/image-discovery-app-js/master/license.txt) file.

[](Esri Tags: Image Discovery)
[](Esri Language: JavaScript)
