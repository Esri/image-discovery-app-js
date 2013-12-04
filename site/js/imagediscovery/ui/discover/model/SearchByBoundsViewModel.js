define([
    "dojo/_base/declare",
    "dojo/Evented"
],
    function (declare, Evented) {
        return declare(
            [Evented],
            {
                VIEW_CHANGE: "viewChange",
                firstSearchByBoundsDisplay: true,
                views: {
                    decimalDegree: "decimalDegree",
                    degreeMinuteSeconds: "degreeMinuteSeconds",
                    utm: "utm"
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
                decimalDegreeClick: function () {
                    this.setView(this.views.decimalDegree);
                },
                dmsClick: function () {
                    this.setView(this.views.degreeMinuteSeconds);
                },
                setView: function (type) {
                    if (this.currentView() != type) {
                        this.currentView(type);
                        this.emit(this.VIEW_CHANGE, type);
                    }
                }



            });

    })
;