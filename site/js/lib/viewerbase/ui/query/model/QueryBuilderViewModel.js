//>>built
define("esriviewer/ui/query/model/QueryBuilderViewModel",["dojo/_base/declare","dojo/Evented"],function(_1,_2){return _1([_2],{QUERY_FIELD_DOUBLE_CLICK:"queryFieldDblClick",constructor:function(){this.queryBuilderFields=ko.observableArray();this.selectedQueryBuilderField=ko.observable("");},queryFieldDoubleClick:function(_3){this.emit(this.QUERY_FIELD_DOUBLE_CLICK);},sortFieldNames:function(){this.queryBuilderFields.sort(function(_4,_5){var _6=_4.label.toLowerCase();var _7=_5.label.toLowerCase();return _6==_7?0:(_6<_7?-1:1);});}});});