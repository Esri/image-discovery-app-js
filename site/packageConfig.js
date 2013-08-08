var jsPath = location.pathname.replace(/[^\/]+$/, '');
window.djConfig = {ioPublish: true, isDebug: true, disableFlashStorage: true, debugAtAllCosts: true, parseOnLoad: true, locale: 'en', packages: [
    {name: "imagediscovery", location: jsPath + "js/imagediscovery"},
    {name: "esriviewer", location: jsPath + "js/lib/viewerbase"},
    // {name: "esriviewer", location: "/JavascriptViewerDebug/js/esriviewer"},
    //   {name: "esriviewer", location: "http://diagram4.esri.com/javaScriptLibs/esriviewer_8_8_2013/"},

    {name: "dgrid", location: jsPath + "js/lib/dgrid"}

]};