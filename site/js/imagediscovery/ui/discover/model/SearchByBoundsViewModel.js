define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Evented"
],
    function (declare, lang, Evented) {
        return declare(
            [Evented],
            {
                VIEW_CHANGE: "viewChange",
                firstSearchByBoundsDisplay: true,
                views: {
                    decimalDegree: "decimalDegree",
                    degreeMinuteSeconds: "degreeMinuteSeconds",
                    utm: "utm"//,
                 //   nsew: "nsew"
                },

                constructor: function () {
                    this.currentView = ko.observable(this.views.decimalDegree);

                    var self = this;
                },
                isCurrentView: function (type) {
                    return this.currentView() == type;
                },
                utmClick: function () {
                    this.setView(this.views.utm);
                },
                /*
                nsewClick: function () {
                    this.setView(this.views.nsew);
                },
                */
                decimalDegreeClick: function () {
                    this.setView(this.views.decimalDegree);
                },
                dmsClick: function () {
                    this.setView(this.views.degreeMinuteSeconds);
                },
                setView: function (type) {
                    if (this.currentView() != type) {
                        this.currentView(type);
                        this.emit(this.VIEW_CHANGE,type);
                    }
                }



            });

    })
;