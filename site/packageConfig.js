var jsPath = location.pathname.replace(/[^\/]+$/, '');
window.djConfig = {ioPublish: true, isDebug: true, disableFlashStorage: true, debugAtAllCosts: true, parseOnLoad: true, locale: 'en', packages: [
    {name: "imagediscovery", location: jsPath + "js/imagediscovery"},
    {name: "esriviewer", location: jsPath + "js/lib/viewerbase"},
//    {name: "esriviewer", location: "http:///JavaScriptViewerDebug/js/esriviewer"},
    {name: "dgrid", location: jsPath + "js/lib/dgrid"}
]};



