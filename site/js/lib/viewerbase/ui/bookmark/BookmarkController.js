//>>built
require({cache:{"url:esriviewer/ui/bookmark/theme/bookmarkTheme.css":".createBookmarkWindow{position:absolute;right:255px;height:80px;width:150px;top:40px;z-index:150;padding:5px;background:#F6F6F6;}.createBookmarkWindowHidden{top:-1000px;}.createBookmarkWindow .createBookmarkContent{margin-top:7px;}.createBookmarkWindow * .dijitTextBox{width:95%;}.createBookmarkWindow .createBookmarkActionsContent{margin:5px auto auto;text-align:center;}"}});define("esriviewer/ui/bookmark/BookmarkController",["dojo/_base/declare","xstyle/css!./theme/bookmarkTheme.css","dojo/topic","dojo/has","dojo/cookie","dojo/_base/json","dojo/_base/lang","dojo/_base/window","dojo/dom-construct","./CreateBookmarkWidget"],function(_1,_2,_3,_4,_5,_6,_7,_8,_9,_a){return _1([],{cookieExpiration:365,cookieMode:false,constructor:function(){this.initListeners();if(!(_4("ie")<8)){this.storageProvider=dojox.storage.manager.getProvider();this.cookieMode=false;}else{this.storageProvider=null;this.cookieMode=true;}this.bookmarks=this.initializeBookmarks();if(this.bookmarks==null||!_7.isObject(this.bookmarks)){this.bookmarks={};}},initListeners:function(){_3.subscribe(VIEWER_GLOBALS.EVENTS.BOOKMARK.CREATED,_7.hitch(this,this.handleSaveBookmark));_3.subscribe(VIEWER_GLOBALS.EVENTS.BOOKMARK.STORAGE.GET,_7.hitch(this,this.handleGetBookmarks));_3.subscribe(VIEWER_GLOBALS.EVENTS.BOOKMARK.CREATE_WINDOW.SHOW,_7.hitch(this,this.showCreateBookmarkDisplay));_3.subscribe(VIEWER_GLOBALS.EVENTS.BOOKMARK.REMOVED,_7.hitch(this,this.removeBookmark));},removeBookmark:function(_b){if(this.bookmarks!=null&&_7.isObject(this.bookmarks)&&this.bookmarks[_b]!=null){delete this.bookmarks[_b];this._persistBookmarks();}},handleSaveBookmark:function(_c){if(_c==null||!_7.isObject(_c)){return;}var _d=false;for(var _e in _c){this.bookmarks[_e]=_c[_e];_d=true;}if(_d){this._persistBookmarks();}},_persistBookmarks:function(){if(!this.cookieMode){this._persistToLocalStorage();}else{this._persistToCookies();}},_persistToLocalStorage:function(){this.storageProvider.put(VIEWER_GLOBALS.STORAGE.LABELS.BOOKMARKS,this.bookmarks);},_persistToCookies:function(){_5(VIEWER_GLOBALS.STORAGE.LABELS.BOOKMARKS,_6.toJson(this.bookmarks),{expires:this.cookieExpiration});},handleGetBookmarks:function(_f){if(_f==null||!_7.isFunction(_f)){return;}_f(this.bookmarks);},initializeBookmarks:function(){if(!this.cookieMode){return this._initializeLocalStorageBookmarks();}else{return this._initializeCookieBookmarks();}},_initializeCookieBookmarks:function(){var _10=_5(VIEWER_GLOBALS.STORAGE.LABELS.BOOKMARKS);if(_10!=null&&_10!=""){return _6.fromJson(_10);}return {};},_initializeLocalStorageBookmarks:function(){if(this.storageProvider.hasKey(VIEWER_GLOBALS.STORAGE.LABELS.BOOKMARKS)){return this.storageProvider.get(VIEWER_GLOBALS.STORAGE.LABELS.BOOKMARKS);}return {};},showCreateBookmarkDisplay:function(){if(this.createBookmarkWidget==null){this.createBookmarkWidget=new _a();_3.publish(VIEWER_GLOBALS.EVENTS.PLACEMENT.GLOBAL.PLACE.CREATE_BOOOKMARK,this.createBookmarkWidget);}this.createBookmarkWidget.show();}});});