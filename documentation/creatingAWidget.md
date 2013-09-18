###Widget Structure###


There are 5 items for a widget (sample widget can be found in `js/template/ui/sample`)


 	- CSS Theme
		- Contains styles used in HTML Template
		
	- HTML Template
		- Markup for widget and Knockout data bindings

	- Knockout View Model
		- Data bindings associated with HTML Template
		- http://knockoutjs.com/

	- Window Widget
		- Listens on SHOW/HIDE/TOGGLE (see step 3)
		- Creates Widget instance as window contents
		- Window Icon/Header Text/Positioning

	- Widget
		- Loads HTML Template (dojo text plugin)
		- Imports CSS Theme (xstyle CSS plugin)
		- Binds ViewModel to HTML Template
		- Contains business logic for widget



###Create your own widget###

1. Clone skeleton widget code
	
	- Copy `js/template/ui/skeleton` for an widget structure template 
	- Rename files to reflect what your widgets purpose (ie: `MeasureWidget`)
		- model/ViewModel.js
		- template/Template.html
		- theme/Theme.css
		- Widget.js
		- Window.js

	- For Widget.js and Window.js update define imports to relfect file name changes

2. Add configuration entry for your widget
	- Open `config/baseConfig.json`
	- The file contains entries for what to create on viewer load.
	- Inside of the root configuration object add an entry for the widget you are going to create.

 	for reference, the sample widget uses configuration below. The create flag is checked on viewer load. True creates the widget window and adds a menu item to the tools menu. We will use this entry later in JavaScript code.

    	"sampleWidget":{
    		"create": true
    	}
3. Create events for window show/hide/toggle
	- Open `js/template/base/TemplateGlobals.js`
	- Inside of the window object, create an object with a unique name describing your widget (MY_WIDGET is used below)
	- The string values must be unique over the entire viewer application

			WINDOW:{
				SAMPLE:{
					SHOW: "sample:show",
					HIDE: "sample:hide",
					TOGGLE: "sample:toggle"
				},
				MY_WIDGET:{
					SHOW: "myWidget:show",
					HIDE: "myWidget:hide",
					TOGGLE: "myWidget:toggle"
				}
			}
4. Hook into the window display events

	- Open renamed Window.js class from step 1
	- in the initListeners function replace "SKELETON" with your WINDOW entry from step 3
	
					TEMPLATE_GLOBALS.EVENTS.WINDOW.MY_WIDGET.SHOW
					TEMPLATE_GLOBALS.EVENTS.WINDOW.MY_WIDGET.HIDE
					TEMPLATE_GLOBALS.EVENTS.WINDOW.MY_WIDGET.TOGGLE

5. Read configuration for widget creation
	- Open `js/template/manager/base/TemplateViewerManager.js`
	- Inside of the `loadUI` function you will add an entry for creating your widget
	- Follow the format of `_createSampleWidget`
		- The underscore method checks the configuration for the "create" flag from step 2. If the widget is to be created it calls `createSampleWidget`
		- Copy and rename these two functions. Add the underscore method to `loadUI`

6. Create instance of your widget
	- Open `js/template/manager/templateViewerManagerWindow.js`
	- Import your window class from step 1 (like `SampleWindow` on line 4)
	- Override the added method without the underscore from step 5 (ie: `createSampleWidget`)
	- Create an instance of your window in the overridden method (refer to `createSampleWidget`)

7. Add your widget to the tools dropdown
	- Open `js/template/ui/tools/TemplateViewerTools.js`
	- Look over the class to see how the "Sample Widget" menu item is created
		- there is a boolean flag that dictates creation
		- the configuration entry is read inside of `loadViewerConfigurationData`.The boolean flag is set to this value.
		- 	if the boolean flag is true, the menu item is created and published using the `ADD_TOOL` topic
	- Create a boolean flag for your widget 
	- Inside of `loadViewerConfigurationData` retrieve your widgets configuration
	- Set the boolean flag on the class for menu item creation from the configuration entry
	- Inside of createMenuItems check the create flag, if true create the menu item
	- Using the code provided that creates the "Sample Widget" menu item, create your own menu item
	- Publish the add tool event (with your menu item as the second parameter) to add your menu item to the tools dropdown menu
	- Make sure the `onClick` method of your menu item published the SHOW topic you created in step 3

		 `topic.publish(TEMPLATE_GLOBALS.EVENTS.WINDOW.MY_WIDGET.SHOW)`

8. Your widget should now be fully functional and available under the tools drowdown menu of the viewer.