//>>built
define("esriviewer/manager/base/ViewerManager",["dojo/_base/declare","dojox/storage","dojo/topic","dojo/_base/window","dojo/_base/lang","./IdentityManagerMixin","../../base/Configurable","../../base/LocationServiceSupport","../../base/DataLoaderSupport","../../map/MapManager","../../portal/PortalViewerManagerSupportMixin","../../map/geometry/GeometryServiceController","./ViewerManagerUI","./WebMapTemplateConfigurationUtil","esri/urlUtils","esri/arcgis/utils","../../map/base/LayerQueryTools"],function(_1,_2,_3,_4,_5,_6,_7,_8,_9,_a,_b,_c,_d,_e,_f,_10,_11){return _1([_b,_7,_8,_9,_d,_6],{portalSharingRestUrl:"/sharing/rest",portalContentUrl:"/sharing/rest/content/items",baseConfigurationLoaded:false,forceHideCoreTimeSlider:false,useProxyForConfig:false,useProxyForPositionConfig:false,allowAccordionMove:true,allowAccordionCollapse:true,forceHideAccordionTab:false,configUrl:"config/baseConfig.json",viewerPositioningConfigUrl:"config/viewerPositioning.json",constructor:function(_12){_5.mixin(this,_12||{});this._initializeStorageProvider();var _13=_f.urlToObject(document.location.href);this.appId=_13.query?_13.query.appid:null;this.processConfig();},processConfig:function(){if(this.appId!=null){var _14=new _e();_14.loadConfiguration(this.appId).then(_5.hitch(this,this._handleWebMapTemplateConfigurationLoaded));}else{if(this.useProxyForConfig){this.loadProxiedConfig();}else{this.loadConfig();}}},_handleWebMapTemplateConfigurationLoaded:function(_15){this.handleConfigLoaded(_15);},handleConfigLoaded:function(_16){VIEWER_UTILS.debug("Configuration Loaded");this.viewerConfig=_16;if(_16.windowTitle){_4.doc.title=_16.windowTitle;}else{_4.doc.title="JavaScript Map Viewer";}if(this.viewerConfig&&this.viewerConfig.portal!=null&&_5.isObject(this.viewerConfig.portal)&&this.viewerConfig.portal.url){var _17=this.viewerConfig.portal.url;var _18=_17.toLowerCase();if(_18.indexOf("http://")<0&&_18.indexOf("https://")<0){_17="http://"+_17;}_10.arcgisUrl=VIEWER_UTILS.joinUrl(_17,this.portalContentUrl);}if(this.useProxyForPositionConfig){this.loadProxiedJson(this.viewerPositioningConfigUrl,_5.hitch(this,this.handleWindowPositionsConfigLoaded),_5.hitch(this,this.handleWindowPositionsConfigLoadFailed));}else{this.loadJson(this.viewerPositioningConfigUrl,_5.hitch(this,this.handleWindowPositionsConfigLoaded),_5.hitch(this,this.handleWindowPositionsConfigLoadFailed));}},startupViewer:function(){this._initListeners();this.initListeners();this._createViewerManager();this.createLayerQueryTools();},createLayerQueryTools:function(){this.layerQueryTools=new _11();},initListeners:function(){},_initListeners:function(){this.inherited(arguments);_3.subscribe(VIEWER_GLOBALS.EVENTS.MAP.LOADED,_5.hitch(this,this.handleMapLoaded));_3.subscribe(VIEWER_GLOBALS.EVENTS.CONFIGURATION.GET,_5.hitch(this,this.handleGetConfiguration));_3.subscribe(VIEWER_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY,_5.hitch(this,this.handleGetConfigurationKey));},handleGetConfiguration:function(_19){if(_19&&_5.isFunction(_19)){_19(this.viewerConfig);}},handleGetConfigurationKey:function(key,_1a){if(key!=null&&key!=""&&_1a&&_5.isFunction(_1a)){_1a(this.viewerConfig[key]);}},handleMapLoaded:function(map){this.map=map;PROJECTION_UTILS.setMapSpatialReference(map.spatialReference);this.loadControllers();this.loadUI();},loadUI:function(){this.inherited(arguments);},_initializePortalSupport:function(){return this.inherited(arguments);},loadControllers:function(){if(this.viewerConfig.geometryServiceUrl!=null&&this.viewerConfig.geometryServiceUrl){this.geometryServiceController=new _c();_3.publish(VIEWER_GLOBALS.EVENTS.GEOMETRY_SERVICE.CONTROLLER_CREATED);}else{_3.subscribe(VIEWER_GLOBALS.EVENTS.GEOMETRY_SERVICE.EXISTS,_5.hitch(this,function(_1b){if(_1b!=null&&_5.isFunction(_1b)){_1b(false);}}));}if(this.viewerConfig.locators!=null&&_5.isArray(this.viewerConfig.locators)){for(var i=0;i<this.viewerConfig.locators.length;i++){this.addLocator(this.viewerConfig.locators[i].url,this.viewerConfig.locators[i].label);}}},handleWindowPositionsConfigLoaded:function(_1c){VIEWER_GLOBALS.windowPositioning=_1c;this.createMessagingAndLogging();if(!this.baseConfigurationLoaded){this.handleBaseConfigurationsLoaded();}},handleWindowPositionsConfigLoadFailed:function(){VIEWER_GLOBALS.windowPositioning={};this.createMessagingAndLogging();if(!this.baseConfigurationLoaded){this.handleBaseConfigurationsLoaded();}},createMessagingAndLogging:function(){this._createLoggingWidget();this._createMessagingWidget();},handleBaseConfigurationsLoaded:function(){this.baseConfigurationLoaded=true;this.startupViewer();},_createViewerManager:function(){this._createLayersWidget();if(this._initializePortalSupport!=null&&_5.isFunction(this._initializePortalSupport)){_3.subscribe(VIEWER_GLOBALS.EVENTS.PORTAL.INITIALIZED,_5.hitch(this,function(){this.mapManager=new _a({webMapItem:this.viewerConfig.webMapItem});}));var _1d=this._initializePortalSupport();if(!_1d){this.mapManager=new _a();}}else{this.mapManager=new _a();}},_createLayersWidget:function(){this.createLayersWidget();},createLayersWidget:function(){},_initializeStorageProvider:function(){var _1e=dojox.storage.manager.getProvider();_1e.initialize();},createDefaultAccordionTools:function(){},handleToggleAccordion:function(){this.viewerAccordion.toggle();}});});