//>>built
define("esriviewer/ui/logging/LoggingWidgetWindow",["dojo/_base/declare","dojo/topic","dojo/_base/lang","dojo/dom-style","../window/WindowWidget","./LoggingWidget"],function(_1,_2,_3,_4,_5,_6){return _1([_5],{defaultPositioning:{x:10,y:240},windowWidth:"500px",windowHeaderText:"Logging",windowIconAltText:"Logging",windowIconClass:"commonIcons16 list",positioningParamName:"logging",postCreate:function(){this.inherited(arguments);this.loggingWidget=new _6();this.setContent(this.loggingWidget.domNode);},initListeners:function(){this.inherited(arguments);this.subscribes.push(_2.subscribe(VIEWER_GLOBALS.EVENTS.LOGGING.WINDOW.SHOW,_3.hitch(this,this.show)));this.subscribes.push(_2.subscribe(VIEWER_GLOBALS.EVENTS.LOGGING.WINDOW.HIDE,_3.hitch(this,this.hide)));this.subscribes.push(_2.subscribe(VIEWER_GLOBALS.EVENTS.LOGGING.WINDOW.TOGGLE,_3.hitch(this,this.toggle)));},hidePopups:function(){this.inherited(arguments);if(this.loggingWidget){this.loggingWidget.hidePopups();}}});});