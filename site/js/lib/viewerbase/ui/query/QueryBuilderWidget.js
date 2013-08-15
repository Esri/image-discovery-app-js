//>>built
require({cache:{"url:esriviewer/ui/query/theme/queryBuilderTheme.css":".queryBuilderFields, .queryBuilderSqlContainer, .queryBuilderUniqueValues{width:95%;margin-left:2.5%;margin-bottom:8px;margin-top:9px;}.queryBuilderUniqueValues, .queryBuilderFields{height:150px;}.queryBuilderUniqueValues{width:95%;margin-right:2.5%;margin-bottom:8px;}.queryBuilderUniqueValues{font-size:8pt;}.queryBuilderUniqueValuesToggleLabel{font-size:9pt;}.queryBuilderToggleUniqueValuesImg{vertical-align:middle;float:left;}.queryBuilderUniqueValuesToggleContainer{margin-left:5px;margin-top:10px;cursor:pointer;}.queryBuilderButtons{margin:auto;text-align:center;}.queryActionButtonsLeft{float:left;margin-bottom:10px;}.queryActionButtonsRight{float:right;margin-bottom:10px;}.queryActionButtons{margin-bottom:10px;}.queryBuilderButtons .dijitButton{padding:0;margin:5px 1px;}.queryLayerNameContainer{margin-left:10px;margin-top:5px;}.toggleQueryUniqueValuesButton{float:left;}","url:esriviewer/ui/query/template/QueryBuilderTemplate.html":"<div>\r\n    <div class=\"queryLayerNameContainer\"><span>Query Layer: </span><span\r\n            data-dojo-attach-point=\"queryLayerNameLabel\"></span></div>\r\n    <select data-dojo-attach-point=\"queryBuilderFields\"\r\n            data-bind=\"event: {dblclick: queryFieldDoubleClick},options: queryBuilderFields ,value:selectedQueryBuilderField, optionsText: 'label', optionsValue: 'value'\"\r\n            class=\"queryBuilderFields\" size=\"7\">\r\n    </select>\r\n\r\n    <div class=\"queryBuilderButtons\">\r\n        <div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"equalsOperatorButton\"\r\n                 disabled=\"disabled\">=\r\n            </div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"greaterThanOperatorButton\"\r\n                 disabled=\"disabled\">&gt;</div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"lessThanOperatorButton\"\r\n                 disabled=\"disabled\">&lt;</div>\r\n            <div data-dojo-type=\"dijit/form/Button\"\r\n                 data-dojo-attach-point=\"lessThanGreaterThanOperatorButton\" disabled=\"disabled\">&lt;\r\n                &gt;</div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"greaterThanEqualsOperatorButton\"\r\n                 disabled=\"disabled\">&gt;=\r\n            </div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"lessThanEqualsOperatorButton\"\r\n                 disabled=\"disabled\">&lt;=\r\n            </div>\r\n        </div>\r\n        <div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"likeAppenderButton\"\r\n                 disabled=\"disabled\">LIKE\r\n            </div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"notAppenderButton\"\r\n                 disabled=\"disabled\">NOT\r\n            </div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"isAppenderButton\"\r\n                 disabled=\"disabled\">IS\r\n            </div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"andAppenderButton\"\r\n                 disabled=\"disabled\">AND\r\n            </div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"orAppenderButton\"\r\n                 disabled=\"disabled\">OR\r\n            </div>\r\n        </div>\r\n    </div>\r\n    <div class=\"queryBuilderUniqueValuesToggleContainer\">\r\n        <div class=\"togglerContainer\" data-dojo-attach-event=\"onclick: toggleUniqueValuesContainer\">\r\n            <div data-dojo-attach-point=\"queryBuilderToggleUniqueValuesImg\"\r\n                 class=\"commonIcons16 up toggleQueryUniqueValuesButton\"\r\n                 title=\"Toggle Unique Values\"></div>\r\n            <span class=\"queryBuilderUniqueValuesToggleLabel\">Unique Values</span>\r\n        </div>\r\n                    <span data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"loadUniqueValuesButton\"\r\n                          style=\"float:right;margin-right: 15px;display:none\"\r\n                          data-dojo-attach-event=\"onClick: handleGetUniqueValues\">Populate</span>\r\n\r\n    </div>\r\n    <div class=\"queryBuilderUniqueValuesContainer\"\r\n         data-dojo-attach-point=\"queryBuilderUniqueValuesContainer\" style=\"display:none;text-align:right\">\r\n        <select data-dojo-attach-point=\"queryBuilderUniqueValuesSelect\" class=\"queryBuilderUniqueValues\"\r\n                data-dojo-attach-event=\"ondblclick: addUniqueValueToQueryString\"\r\n                size=\"7\"></select>\r\n    </div>\r\n    <div class=\"queryBuilderSqlContainer\" data-dojo-attach-point=\"queryBuilderSqlContainer\">\r\n        <div data-dojo-type=\"dijit/form/Textarea\" data-dojo-attach-point=\"queryBuilderSql\"\r\n             disabled=\"disabled\"></div>\r\n    </div>\r\n    <div class=\"queryActionButtons\">\r\n        <div class=\"queryActionButtonsLeft\">\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"backButton\" disabled=\"disabled\"\r\n                 data-dojo-attach-event=\"onClick:stepQueryBack\"\r\n                    >\r\n                Back\r\n            </div>\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"clearButton\"\r\n                 data-dojo-attach-event=\"onClick:clearQuery\"\r\n                    >\r\n                Clear\r\n            </div>\r\n        </div>\r\n        <div class=\"queryActionButtonsRight\">\r\n            <div data-dojo-type=\"dijit/form/Button\" data-dojo-attach-point=\"submitButton\"\r\n                 data-dojo-attach-event=\"onClick:submitQuery\"\r\n                    >\r\n                Submit\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>\r\n"}});define("esriviewer/ui/query/QueryBuilderWidget",["dojo/_base/declare","xstyle/css!./theme/queryBuilderTheme.css","dojo/text!./template/QueryBuilderTemplate.html","dojo/_base/json","dojo/has","dojo/on","dojo/topic","dojo/dom-class","dojo/dom-attr","dojo/dom-style","dojo/_base/lang","dojo/dom-construct","dojo/_base/Color","../base/UITemplatedWidget","./QueryBuilderData","./model/QueryBuilderViewModel","dijit/form/Textarea","dijit/form/Button","esri/layers/GraphicsLayer","esri/symbols/SimpleFillSymbol","esri/symbols/SimpleLineSymbol","esri/symbols/SimpleMarkerSymbol","esri/renderers/SimpleRenderer","esri/renderers/UniqueValueRenderer","esri/renderers/ClassBreaksRenderer","esri/tasks/query","esri/tasks/QueryTask","esri/InfoTemplate"],function(_1,_2,_3,_4,_5,on,_6,_7,_8,_9,_a,_b,_c,_d,_e,_f,_10,_11,_12,_13,_14,_15,_16,_17,_18,_19,_1a,_1b){return _1([_d],{bindingsApplied:false,defaultUniqueValuesFieldType:"esriFieldTypeString",fieldTypeWrappers:{esriFieldTypeString:{prefix:"'",suffix:"'"},esriFieldTypeDate:{prefix:"date '",suffix:"'"}},uniqueValuesDirty:false,returnGeometry:true,basicMode:true,sortUniqueValues:true,templateString:_3,queryUrlWithLayerId:null,constructor:function(_1c){this.uniqueFieldValuesLookup={};this.queryLayer=null;this.queryFields=null;_a.mixin(this,_1c||{});this.queryData=new _e();},initListeners:function(){this.inherited(arguments);this.connects.push(on(this.equalsOperatorButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.OPERATOR,"=")));this.connects.push(on(this.greaterThanOperatorButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.OPERATOR,">")));this.connects.push(on(this.lessThanOperatorButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.OPERATOR,"<")));this.connects.push(on(this.lessThanGreaterThanOperatorButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.OPERATOR,"<>")));this.connects.push(on(this.greaterThanEqualsOperatorButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.OPERATOR,">=")));this.connects.push(on(this.lessThanEqualsOperatorButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.OPERATOR,"<=")));this.connects.push(on(this.likeAppenderButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.OPERATOR,"LIKE")));this.connects.push(on(this.notAppenderButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.OPERATOR,"NOT")));this.connects.push(on(this.isAppenderButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.OPERATOR,"IS")));this.connects.push(on(this.andAppenderButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.APPENDER,"AND")));this.connects.push(on(this.orAppenderButton,"click",_a.hitch(this,this.updateQueryString,this.queryData.APPENDER,"OR")));},applyBindings:function(){if(!this.bindingsApplied){ko.applyBindings(this.viewModel,this.domNode);this.bindingsApplied=true;}},postCreate:function(){this.inherited(arguments);this.viewModel=new _f();this.viewModel.on(this.viewModel.QUERY_FIELD_DOUBLE_CLICK,_a.hitch(this,this.addColumnToQuery,this.queryData.COLUMN));this.viewModel.selectedQueryBuilderField.subscribe(_a.hitch(this,this.handleQueryBuilderFieldChanged));this.queryResponseCallback=_a.hitch(this,this.handleQueryResponse);this.queryResponseErrback=_a.hitch(this,this.handleQueryError);this.initSymbology();this.operatorButtons=[this.equalsOperatorButton,this.greaterThanOperatorButton,this.lessThanOperatorButton,this.lessThanGreaterThanOperatorButton,this.greaterThanEqualsOperatorButton,this.lessThanEqualsOperatorButton,this.likeAppenderButton,this.notAppenderButton,this.isAppenderButton];this.appenderButtons=[this.andAppenderButton,this.orAppenderButton];if(this.basicMode){this.queryData.setBasicMode();this.loadBasicView();}else{this.queryData.setAdvancedMode();}this.setupQueryLayer();if(this.queryFields!=null&&_a.isArray(this.queryFields)&&this.queryFields.length>0){this.addOptions(this.queryFields);this.viewModel.sortFieldNames();this.applyBindings();}if(this.queryUrlWithLayerId!=null){VIEWER_UTILS.getLayerInfoFromService(this.queryLayer.url,this.queryLayer.layerId,_a.hitch(this,this.handleLayerInfoLoaded));}if(!this.queryData.isBasicMode()){this._enableAllInputs();}this.tweakUI();this.createResultGraphicsLayer();},createResultGraphicsLayer:function(){if(this.resultsGraphicsLayer==null){this.resultsGraphicsLayer=_12();this.resultsGraphicsLayer.on("mouse-over",function(evt){_9.set(evt.target,"cursor","pointer");});_6.publish(VIEWER_GLOBALS.EVENTS.MAP.LAYERS.ADD_EXTERNAL_MANAGED_LAYER,this.resultsGraphicsLayer);}},initSymbology:function(){this.polygonSymbol=new _13(_13.STYLE_SOLID,new _14(_14.STYLE_SOLID,new _c([0,0,255]),1),new _c([0,0,255,0]));this.pointSymbol=new _15(_15.STYLE_X,1,new _14(_14.STYLE_SOLID,new _c("blue")));this.lineSymbol=new _14(_14.STYLE_SOLID,new _c([0,0,255]),1);},setupQueryLayer:function(){this.queryUrlWithLayerId=this.queryLayer.url;if(!(/\/$/.test(this.queryUrlWithLayerId))){this.queryUrlWithLayerId+="/";}this.queryUrlWithLayerId+=this.queryLayer.layerId;},loadViewerConfigurationData:function(){var _1d=null;_6.publish(VIEWER_GLOBALS.EVENTS.CONFIGURATION.GET_ENTRY,"queryBuilder",function(_1e){_1d=_1e;});if(_1d&&_1d.configuration!=null&&_a.isObject(_1d.configuration)){_a.mixin(this,_1d.configuration);this.returnGeometry=true;}},tweakUI:function(){if(_5("ie")<8){_9.set(this.queryBuilderSqlContainer,"marginLeft","0");}},toggleUniqueValuesContainer:function(){if(_7.contains(this.queryBuilderToggleUniqueValuesImg,"up")){var _1f=null;if((this.queryBuilderFields.selectedIndex>-1)&&(this.queryBuilderFields.options[this.queryBuilderFields.selectedIndex]!=null)){_1f=this.queryBuilderFields.options[this.queryBuilderFields.selectedIndex];}if(_1f==null){this.hideUniqueValuesContent();}else{this.showUniqueValuesContent();}}else{this.hideUniqueValuesContent();}},handleLayerInfoLoaded:function(_20){if(_20&&_a.isObject(_20)){if(this.queryFields==null||(_a.isArray(this.queryFields)&&this.queryFields.length==0)){this.populateLayerFields(_20);}if(_20.drawingInfo&&_20.drawingInfo.renderer){var _21=_20.drawingInfo.renderer;if(_21.type==VIEWER_GLOBALS.ESRI_RENDERER_TYPES.SIMPLE){this.graphicsRenderer=new _16(_21);}else{if(_21.type==VIEWER_GLOBALS.ESRI_RENDERER_TYPES.UNIQUE_VALUE){this.graphicsRenderer=new _17(_21);}else{if(_21.type==VIEWER_GLOBALS.ESRI_RENDERER_TYPES.CLASS_BREAKS){this.graphicsRenderer=new _18(_21);}}}}}},populateLayerFields:function(_22){if(_22&&_22.fields){_8.set(this.queryLayerNameLabel,"innerHTML",_22.name);var _23=[];var i;for(i=0;i<_22.fields.length;i++){this.viewModel.queryBuilderFields.push({value:_22.fields[i].name,label:_22.fields[i].name});}this.viewModel.sortFieldNames();}this.applyBindings();},showUniqueValuesContent:function(){_7.remove(this.queryBuilderToggleUniqueValuesImg,"up");_7.add(this.queryBuilderToggleUniqueValuesImg,"down");_9.set(this.queryBuilderUniqueValuesContainer,"display","block");var _24=null;if((this.queryBuilderFields.selectedIndex>-1)&&(this.queryBuilderFields.options[this.queryBuilderFields.selectedIndex]!=null)){_24=this.queryBuilderFields.options[this.queryBuilderFields.selectedIndex];}if(this.uniqueFieldValuesLookup[_24.value]==null){_9.set(this.loadUniqueValuesButton.domNode,"display","block");}if(this.uniqueValuesDirty){this.handleQueryBuilderFieldChanged();}},hideUniqueValuesContent:function(){_7.add(this.queryBuilderToggleUniqueValuesImg,"up");_7.remove(this.queryBuilderToggleUniqueValuesImg,"down");_9.set(this.queryBuilderUniqueValuesContainer,"display","none");_9.set(this.loadUniqueValuesButton.domNode,"display","none");},handleGetUniqueValues:function(){if(this.queryBuilderFields.selectedIndex<0||this.queryBuilderFields.options[this.queryBuilderFields.selectedIndex]===null){return;}var _25=this.queryBuilderFields.options[this.queryBuilderFields.selectedIndex].value;if(_25!=null&&_25!=""){this.getUniqueValuesForField(_25,_a.hitch(this,this._setUniqueQueryValues));}},reset:function(){this.queryData.currentMode=this.BASIC_MODE;this.queryData.queryCacheArray=[];this.queryData.clearQueryCache();this.queryData.setQueryMode(this.queryData.COLUMN);this.loadBasicView();},getUniqueValuesForField:function(_26,_27){if(_27==null||!_a.isFunction(_27)){return;}if(this.uniqueFieldValuesLookup[_26]!=null){_27(this.uniqueFieldValuesLookup[_26]);}else{if(this.queryLayer&&_26!=null){if(this.queryUrlWithLayerId!=null){if(this.uniqueValuesQueryTask==null){this._createUniqueValuesQueryTask();}}if(this.uniqueValuesQueryTask!=null){var _28=new _19();_28.where="1=1";_28.outFields=[_26];var _29=_a.hitch(this,this._handleUniqueValuesResponse,_27);this.uniqueValuesQueryTask.execute(_28,_29);}}}},stepQueryBack:function(){var _2a=this.queryData.popLastQuery();if(_2a==null){return;}if(this.queryData.isBasicMode()){var _2b=this.queryData.getQueryMode();if(this.queryData.isBasicMode()){this.disableQueryInput();this.disableUniqueValueSelect();this.disableOperatorButtons();this.disableAppenderButtons();this.disableColumnSelector();}if(_2a==""){this.noCacheQueryStringRevert(_2a,this.queryData.RESET_BASIC);}else{if(_2b==this.queryData.OPERATOR){this.enableOperatorButtons();this.queryData.setQueryMode(this.queryData.COLUMN);}else{if(_2b==this.queryData.APPENDER){if(this.queryData.isBasicMode()){this.enableAppenderButtons();this.enableQueryInput();this.enableUniqueValueSelect();}this.queryData.setQueryMode(this.queryData.USER_INPUT);}else{if(_2b==this.queryData.COLUMN){if(this.queryData.isBasicMode()){this.enableColumnSelector();}this.queryData.setQueryMode(this.queryData.APPENDER);}else{if(_2b==this.queryData.USER_INPUT){if(this.queryData.isBasicMode()){this.enableQueryInput();this.enableUniqueValueSelect();this.enableAppenderButtons();}this.queryData.setQueryMode(this.queryData.OPERATOR);}}}}}}else{this.setQueryString(_2a);}if(!this.queryData.hasMoreCachedQueries()){this.backButton.attr("disabled",true);}else{if(this.queryData.hasMoreCachedQueries()){this.backButton.attr("disabled",false);}}this.setQueryString(_2a);},_enableAllInputs:function(){this.enableAppenderButtons();this.enableOperatorButtons();this.enableQueryInput();this.enableUniqueValueSelect();this.enableColumnSelector();},addOptions:function(_2c){for(var i=0;i<_2c.length;i++){var _2d=_2c[i];this.addOption(_2d);}},addOption:function(_2e){if(_2e!=null&&_a.isString(_2e)){_2e={label:_2e,value:_2e};}if(_2e.value!=null&&_2e.label!=null){this.viewModel.queryBuilderFields.push(_2e);}},handleQueryBuilderFieldChanged:function(){if(this.uniqueValuesContainerVisible()){var _2f=this.queryBuilderFields[this.queryBuilderFields.selectedIndex].value;if(this.uniqueFieldValuesLookup[_2f]!=null){this._setUniqueQueryValues(this.uniqueFieldValuesLookup[_2f]);}else{this._clearUniqueQueryValues();}this.uniqueValuesDirty=false;}else{this.uniqueValuesDirty=true;this._clearUniqueQueryValues();}},addUniqueValueToQueryString:function(){var _30=_8.get(this.queryBuilderUniqueValuesSelect,"value");this.updateQueryString(this.queryData.USER_INPUT,_30);},addColumnToQuery:function(_31){var _32=this.viewModel.selectedQueryBuilderField();if(_32==null){return;}this.updateQueryString(_31,_32);},updateQueryString:function(_33,_34){var _35=this.queryBuilderSql.value?this.queryBuilderSql.value:"";this.queryData.cacheQuery(_35);this.backButton.attr("disabled",false);var _36="";if(_35){_36=_35;if(!(/ $/.test(_36))){_36+=" ";}}this.queryBuilderSql.attr("value",_36+=_34);if(this.queryData.isBasicMode()){this.setViewMode(_33);}},setViewMode:function(_37){this.queryData.setQueryMode(_37);if(_37==this.queryData.OPERATOR){if(this.queryData.isBasicMode()){this.disableOperatorButtons();this.enableQueryInput();this.enableUniqueValueSelect();this.enableAppenderButtons();this.enableSqlTextArea();}var _38=this.queryBuilderSql.attr("value");this.queryBuilderSql.attr("value",_38+" ");}else{if(_37==this.queryData.APPENDER){if(this.queryData.isBasicMode()){this.disableQueryInput();this.disableUniqueValueSelect();this.disableAppenderButtons();this.enableColumnSelector();}}else{if(_37==this.queryData.COLUMN){if(this.queryData.isBasicMode()){this.disableColumnSelector();this.enableOperatorButtons();}}else{if(_37==this.queryData.RESET_BASIC){this.loadBasicView();}}}}},enableQueryInput:function(){this.queryBuilderSql.attr("disabled",false);},disableQueryInput:function(){this.queryBuilderSql.attr("disabled",true);},enableUniqueValueSelect:function(){this.queryBuilderUniqueValuesSelect.disabled=false;},disableUniqueValueSelect:function(){this.queryBuilderUniqueValuesSelect.disabled=true;},disableAppenderButtons:function(){for(var i=0;i<this.appenderButtons.length;i++){this.appenderButtons[i].attr("disabled",true);}},enableAppenderButtons:function(){for(var i=0;i<this.appenderButtons.length;i++){this.appenderButtons[i].attr("disabled",false);}},disableOperatorButtons:function(){for(var i=0;i<this.operatorButtons.length;i++){this.operatorButtons[i].attr("disabled",true);}},enableOperatorButtons:function(){for(var i=0;i<this.operatorButtons.length;i++){this.operatorButtons[i].attr("disabled",false);}},disableColumnSelector:function(){this.queryBuilderFields.disabled=true;},enableColumnSelector:function(){this.queryBuilderFields.disabled=false;},clearQuery:function(){this.queryData.clearQueryCache();this.queryData.setQueryMode(this.queryData.COLUMN);if(this.queryData.isBasicMode()){this.loadBasicView();}else{this.queryBuilderSql.attr("value","");}this.clearGraphics();},loadBasicView:function(){this.queryBuilderSql.attr("value","");if(this.queryData.isBasicMode()){this.enableColumnSelector();this.disableAppenderButtons();this.disableOperatorButtons();this.disableQueryInput();this.disableUniqueValueSelect();}},noCacheQueryStringRevert:function(_39,_3a){this.setViewMode(_3a);this.setQueryString(_39);},setQueryString:function(_3b){this.queryBuilderSql.attr("value",_3b);},enableSqlTextArea:function(){this.queryBuilderSql.focus();},_clearUniqueQueryValues:function(){_b.empty(this.queryBuilderUniqueValuesSelect);if(this.uniqueValuesContainerVisible()){_9.set(this.loadUniqueValuesButton.domNode,"display","block");}},_setUniqueQueryValues:function(_3c){if(!this.sortUniqueValues){this._setUniqueQueryValuesUnsorted(_3c);}else{this._setUniqueQueryValuesSorted(_3c);}_9.set(this.loadUniqueValuesButton.domNode,"display","none");},_setUniqueQueryValuesSorted:function(_3d){this._clearUniqueQueryValues();var _3e=[];for(var key in _3d){var _3f=document.createElement("option");_3f.text=key;_3f.value=_3d[key];_3e.push({option:_3f,name:key});}if(this.sortUniqueValues){_3e.sort(function(a,b){return a.name>b.name;});for(var i=0;i<_3e.length;i++){try{this.queryBuilderUniqueValuesSelect.add(_3e[i].option,this.queryBuilderUniqueValuesSelect.options[null]);}catch(e){this.queryBuilderUniqueValuesSelect.add(_3e[i].option,null);}}}_9.set(this.loadUniqueValuesButton.domNode,"display","none");},_setUniqueQueryValuesUnsorted:function(_40){this._clearUniqueQueryValues();for(var key in _40){if(!this.sortUniqueValues){var _41=_b.create("option",{"value":_40[key],"innerHTML":key});_b.place(_41,this.queryBuilderUniqueValuesSelect);}}},_handleUniqueValuesResponse:function(_42,_43){if(_43&&_43.features){var _44=(_43&&_43.fields!=null&&_a.isArray(_43.fields)&&_43.fields.length>0)?_43.fields[0].name:"UNKNOWN";var _45=(_43&&_43.fields!=null&&_a.isArray(_43.fields)&&_43.fields.length>0)?_43.fields[0].type:this.defaultUniqueValuesFieldType;var _46={};for(var i=0;i<_43.features.length;i++){var _47=_43.features[i];for(var key in _47.attributes){var _48=_47.attributes[key];if(_48!=null){var _49=(this.fieldTypeWrappers[_45]!=null)?this.fieldTypeWrappers[_45].prefix:"";var _4a=(this.fieldTypeWrappers[_45]!=null)?this.fieldTypeWrappers[_45].suffix:"";if(_46[_48]==null){_46[_48]=_49+_48.toString().replace(/'/g,"\\/")+_4a;}}}}this.uniqueFieldValuesLookup[_44]=_46;}if(_42!=null&&_a.isFunction(_42)){_42(_46);}},_createUniqueValuesQueryTask:function(){this.uniqueValuesQueryTask=new _1a(this.queryUrlWithLayerId);},submitQuery:function(){var _4b=this.queryBuilderSql.attr("value");if(_4b==""){return;}if(this.queryTask==null){this.queryTask=new _1a(this.queryUrlWithLayerId);}var _4c=new _19();_4c.outFields=["*"];_4c.where=_4b;var _4d;_6.publish(VIEWER_GLOBALS.EVENTS.MAP.EXTENT.GET_EXTENT,function(ext){_4d=ext;});if(_4d!=null&&_4d.spatialReference!=null){_4c.outSpatialReference={wkid:_4d.spatialReference.wkid};}_4c.returnGeometry=this.returnGeometry;if(this.queryTask){VIEWER_UTILS.log("Performing SQL query:",VIEWER_GLOBALS.LOG_TYPE.INFO);VIEWER_UTILS.log(_4b,VIEWER_GLOBALS.LOG_TYPE.INFO);this.queryTask.execute(_4c,this.queryResponseCallback,this.queryResponseErrback);}},clearGraphics:function(){if(this.resultsGraphicsLayer){this.resultsGraphicsLayer.clear();}},handleQueryResponse:function(_4e){this.clearGraphics();if(this.resultsGraphicsLayer){}if(_4e==null||_4e.features==null||!_a.isArray(_4e.features)){this.handleQueryError();}var _4f=_4e.features.length===1?"Result":"Results";_6.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW,"Query Complete ("+_4e.features.length+" "+_4f+")");var _50=this.pointSymbol;if(_4e.geometryType==VIEWER_GLOBALS.ESRI_GEOMETRY_TYPES.POLYGON){_50=this.polygonSymbol;}else{if(_4e.geometryType==VIEWER_GLOBALS.ESRI_GEOMETRY_TYPES.LINE){_50=this.lineSymbol;}}var _51;for(var i=0;i<_4e.features.length;i++){_51=_4e.features[i];if(this.graphicsRenderer==null){_51.setSymbol(_50);}else{_51.setSymbol(this.graphicsRenderer.getSymbol(_51));}_51.setInfoTemplate(this.getInfoTemplate(_51));this.resultsGraphicsLayer.add(_51);}VIEWER_UTILS.log("SQL Query Returned "+_4e.features.length+" "+_4f,VIEWER_GLOBALS.LOG_TYPE.INFO);},handleQueryError:function(){VIEWER_UTILS.log("There was an error performing query. Check your SQL",VIEWER_GLOBALS.LOG_TYPE.ERROR);_6.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW,"There was an error performing query. Check your SQL");},uniqueValuesContainerVisible:function(){var _52=_9.get(this.queryBuilderUniqueValuesContainer,"display");return _52.toLowerCase()==="block";},getInfoTemplate:function(_53){var _54=new _1b();_54.setTitle("Result");var _55=_b.create("div");var _56=_b.create("div");_b.place(_56,_55);var _57;var _58=_53.attributes;for(var key in _58){var _59=_b.create("div",{className:"infoTemplateEntry"});var _5a=_b.create("span",{className:"infoTemplateEntryLbl",innerHTML:key+":"});_57=_58[key];var _5b=_b.create("span",{className:"infoTemplateEntryValue",innerHTML:_57});_b.place(_5a,_59);_b.place(_5b,_59);_b.place(_59,_56);}_54.setContent(_55.innerHTML);return _54;}});});