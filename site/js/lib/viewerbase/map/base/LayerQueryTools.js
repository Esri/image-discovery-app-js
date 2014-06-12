//>>built
define("esriviewer/map/base/LayerQueryTools",["dojo/_base/declare","dojo/_base/lang","dojo/topic","esri/tasks/QueryTask","esri/tasks/query","esri/tasks/StatisticDefinition","./DistinctQuery"],function(_1,_2,_3,_4,_5,_6,_7){return _1([],{constructor:function(){this.layerFieldsCache={};this.initListeners();},initListeners:function(){this.inherited(arguments);_3.subscribe(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.QUERY_LAYER,_2.hitch(this,this.handleQueryLayer));_3.subscribe(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.GET_MIN_MAX_FOR_FIELD,_2.hitch(this,this._handleGetMinMaxForField));_3.subscribe(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.GET_DISTINCT_FIELD_VALUES,_2.hitch(this,this._handleGetDistinctFieldValues));},_handleGetDistinctFieldValues:function(_8){if(!this._validateParameters(_8)){return;}var _9=new _7();_9.returnGeometry=false;if(_8.whereClause!=null&&_8.whereClause.length>0){_9.where=_8.whereClause;}else{_9.where="1 = 1";}if(_8.geometry!=null){_9.geometry=_8.geometry;}if(_8.distinctField!=null){_9.orderByFields=[_8.distinctField];_9.outFields=[_8.distinctField];}else{if(_8.errback!=null&&_2.isFunction(_8.errback)){_8.errback("Must supply distinct field");return;}}var _a=this._getQueryTask(_8);this._performQuery(_a,_9,function(_b){if(!_8.processResponse){_8.callback(_b);}else{var _c=[];if(_b&&_b.features&&_b.features.length>0){var _d;for(var i=0;i<_b.features.length;i++){_d=_b.features[i].attributes;_c.push(_d[_8.distinctField]);}}_8.callback(_c);}},_8.errback);},_validateParameters:function(_e){if(_e.layer==null||_e.layer.url==null){if(_e.errback!=null&&_2.isFunction(_e.errback)){_e.errback("There is no query layer");}return false;}if(_e.callback==null||!_2.isFunction(_e.callback)){return false;}if(_e.errback==null){_e.errback=_2.hitch(this,this._handleQueryLayerDefaultErrback,_e.layer);}return true;},_getQueryTask:function(_f){var _10=_f.layer.url;if(_f.layerId!=null){_10=VIEWER_UTILS.joinUrl(_10,_f.layerId);}return new _4(_10);},_handleGetMinMaxForField:function(_11){if(!this._validateParameters(_11)){return;}var _12=this._getQueryTask(_11);var _13=new _5();_13.returnGeometry=false;var _14=[];var _15=new _6();_15.onStatisticField=_11.minFieldName;_15.outStatisticFieldName="min";_15.statisticType="min";var _16=new _6();_16.onStatisticField=_11.maxFieldName;_16.outStatisticFieldName="max";_16.statisticType="max";_14.push(_15);_14.push(_16);_13.outStatistics=_14;this._performQuery(_12,_13,function(res){var min=null;var max=null;if(res&&res.features&&res.features.length>0){min=res.features[0].attributes.min;max=res.features[0].attributes.max;}_11.callback({min:min,max:max});},_11.errback);},handleQueryLayer:function(_17){if(!this._validateParameters(_17)){return;}var _18=this._getQueryTask(_17);var _19=new _5();_19.returnGeometry=_17.returnGeometry;var map;_3.publish(VIEWER_GLOBALS.EVENTS.MAP.GET,function(_1a){map=_1a;});_19.outSpatialReference=map.extent.spatialReference;if(_17.objectIds!=null&&_17.objectIds.length>0){_19.objectIds=_17.objectIds;}if(_17.whereClause!=null&&_17.whereClause.length>0){_19.where=_17.whereClause;}if(_17.geometry!=null){_19.geometry=_17.geometry;}if(_17.outFields!=null){_19.outFields=_17.outFields;}else{if(_17.returnGeometry){_19.outFields=["*"];}else{var _1b=queryUrl.toLowerCase();if(this.layerFieldsCache[_1b]==null){if(_17.layerId!=null){var _1c=_17.callback;var _1d=_17.errback;VIEWER_UTILS.getLayerInfoFromService(_17.layer.url,_17.layerId,_2.hitch(this,function(_1e){var _1f=this._generateOutFieldsFromLayer(_1e);this.layerFieldsCache[_1b]=_1f;_19.outFields=_1f;this._performQuery(_18,_19,_1c,_1d);}));return;}else{var _20=this._generateOutFieldsFromLayer(_17.layer);this.layerFieldsCache[_1b]=_20;_19.outFields=_20;}}else{_19.outFields=this.layerFieldsCache[_1b];}}}this._performQuery(_18,_19,_17.callback,_17.errback);},_generateOutFieldsFromLayer:function(_21){if(_21==null||!_2.isObject(_21)||_21.fields==null||!_2.isArray(_21.fields)){return ["*"];}var _22=[];var _23;for(var i=0;i<_21.fields.length;i++){_23=_21.fields[i];if(_23.type!=VIEWER_GLOBALS.ESRI_FIELD_TYPES.GEOMETRY){_22.push(_23.name);}}return _22;},_performQuery:function(_24,_25,_26,_27){_24.execute(_25,_26,_27);},_handleQueryLayerDefaultErrback:function(_28,err){VIEWER_UTILS.log("Could not perform layer query",VIEWER_GLOBALS.LOG_TYPE.ERROR);_3.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW,"Could not perform layer query");}});});