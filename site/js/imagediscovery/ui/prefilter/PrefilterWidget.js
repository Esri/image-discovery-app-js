define([
    "dojo/_base/declare",
    "dojo/text!./template/PrefilterWidgetTemplate.html",
    //  "xstyle/css!./theme/PrefilterWidgetTheme.css",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "esriviewer/ui/base/UITemplatedWidget",
    "dijit/form/HorizontalSlider",
    "./model/PrefilterWidgetViewModel",
    "dijit/form/DropDownButton",
    "dijit/DropDownMenu",
    "dijit/MenuItem"
],
    //   function (declare, template, theme,  lang, domConstruct, UITemplatedWidget, HorizontalSlider, PrefilterWidgetViewModel, DropDownButton, DropDownMenu, MenuItem) {
    function (declare, template, lang, domConstruct, UITemplatedWidget, HorizontalSlider, PrefilterWidgetViewModel, DropDownButton, DropDownMenu, MenuItem) {
        return declare(
            [ UITemplatedWidget],
            {
                "cloudCover": {
                    "operator": "<=",
                    "fieldName": "CloudCover",
                    "values": [
                        {
                            "label": "0%;",
                            "value": 0
                        },
                        {
                            "label": "10%",
                            "value": 10
                        },
                        {
                            "label": "20%",
                            "value": 20
                        },
                        {
                            "label": "30%",
                            "value": 30
                        },
                        {
                            "label": "40%",
                            "value": 40
                        },
                        {
                            "label": "50%",
                            "value": 50
                        },
                        {
                            "label": "60%",
                            "value": 60
                        },
                        {
                            "label": "70%",
                            "value": 70
                        },
                        {
                            "label": "80%",
                            "value": 80
                        },
                        {
                            "label": "90%",
                            "value": 90
                        },
                        {
                            "label": "100%",
                            "value": 100
                        }
                    ]
                },
                "satellite": {
                    "operator": "=",
                    "fieldName": "Satellite",
                    "values": [
                        {
                            "value": "WV1",
                            "label": "WorldView 1 (WV1)"
                        },
                        {
                            "value": "WV2",
                            "label": "WorldView 2 (WV2)"
                        },
                        {
                            "value": "P1",
                            "label": "Pleiades 1 (P1)"
                        },
                        {
                            "value": "QB",
                            "label": "QuickBird (QB)"
                        },
                        {
                            "value": "GE1",
                            "label": "GeoEye 1 (GE1)"
                        },
                        {
                            "value": "IK",
                            "label": "IKONOS (IK)"
                        },
                        {
                            "value": "RE",
                            "label": "RapidEye (RE)"
                        },
                        {
                            "value": "SP1",
                            "label": "SPOT 1 (SP1)"
                        },
                        {
                            "value": "SP2",
                            "label": "SPOT 2 (SP2)"
                        },
                        {
                            "value": "SP3",
                            "label": "SPOT 3 (SP3)"
                        },
                        {
                            "value": "SP4",
                            "label": "SPOT 4 (SP4)"
                        },
                        {
                            "value": "SP5",
                            "label": "SPOT 5 (SP5)"
                        },
                        {
                            "value": "SP6",
                            "label": "SPOT 6 (SP6)"
                        }
                    ]
                },
                "offNadir": {
                    "operator": "<=",
                    "fieldName": "offNadir",
                    "values": [
                        {
                            "label": "5&deg;",
                            "value": 5
                        },
                        {
                            "label": "10&deg;",
                            "value": 10
                        },
                        {
                            "label": "15&deg;",
                            "value": 15
                        },
                        {
                            "label": "20&deg;",
                            "value": 20
                        },
                        {
                            "label": "25&deg;",
                            "value": 25
                        },
                        {
                            "label": "30&deg;",
                            "value": 30
                        },
                        {
                            "label": "45&deg;",
                            "value": 45
                        },
                        {
                            "label": "60&deg;",
                            "value": 60
                        },
                        {
                            "label": "75&deg;",
                            "value": 75
                        },
                        {
                            "label": "90&deg;",
                            "value": 90
                        }
                    ]
                },
                "resolution": {
                    "operator": "<=",
                    "fieldName": "lowPS",
                    "values": [
                        {
                            "label": "50cm",
                            "value": .05
                        },
                        {
                            "label": "1m",
                            "value": 1
                        },
                        {
                            "label": "5m",
                            "value": 5
                        },
                        {
                            "label": "10m",
                            "value": 10
                        },
                        {
                            "label": "20m",
                            "value": 20
                        },
                        {
                            "label": "30m",
                            "value": 30
                        }
                    ]
                },
                templateString: template,
                showCloudCover: true,
                showGSD: true,
                showSensor: true,
                sensors: null,
                constructor: function (params) {
                    lang.mixin(this, params || {});
                    this._validateParameters();
                },
                _validateParameters: function () {
                },
                postCreate: function () {
                    this.inherited(arguments);
                    this.viewModel = new PrefilterWidgetViewModel();
                    this.viewModel.showSensor(this.showSensor);
                    this.createOffNadirDropdown();
                    this.createResolutionDropdown();
                    this.createSatelliteDropdown();
                    this.createCloudCoverDropdown();
                    ko.applyBindings(this.viewModel, this.domNode);
                },
                getQuery: function () {
                    var queryString = "";
                    if (this.currentResolutionValueObj != null) {
                        queryString += this.resolution.fieldName + " " + this.resolution.operator + " " + this.currentResolutionValueObj.value;
                    }
                    if (this.currentSatelliteValueObj != null) {
                        if (queryString != "") {
                            queryString += " AND ";
                        }
                        queryString += this.satellite.fieldName + " " + this.satellite.operator + " " + this.currentSatelliteValueObj.value;
                    }
                    if (this.currentOffNadirValueObj != null) {
                        if (queryString != "") {
                            queryString += " AND ";
                        }
                        queryString += this.offNadir.fieldName + " " + this.offNadir.operator + " " + this.currentOffNadirValueObj.value;
                    }
                    if (this.currentCloudCoverValueObj != null) {
                        if (queryString != "") {
                            queryString += " AND ";
                        }
                        queryString += this.cloudCover.fieldName + " " + this.cloudCover.operator + " " + this.currentCloudCoverValueObj.value;
                    }
                    return queryString;
                },
                _handleResolutionValueChanged: function (value) {
                    this.currentResolutionValueObj = value;
                    if (value == null) {
                        this.resolutionDropdown.set("label", "Resolution");
                    }
                    else {
                        this.resolutionDropdown.set("label", "Resolution: <span style='color:blue'>" + value.label + "</span>")
                    }
                },
                createResolutionDropdown: function () {
                    var params = {
                        values: [
                            {
                                label: "50cm",
                                value: .05
                            },
                            {
                                label: "1m",
                                value: 1
                            },
                            {
                                label: "5m",
                                value: 5
                            },
                            {
                                label: "10m",
                                value: 10
                            },
                            {
                                label: "20m",
                                value: 20
                            },
                            {
                                label: "30m",
                                value: 30
                            }
                        ],
                        valueChangeHandler: lang.hitch(this, this._handleResolutionValueChanged)
                    };
                    this.resolutionDropdown = this._createDropDown(params);
                    //init the empty value
                    this._handleResolutionValueChanged(null);
                    domConstruct.place(this.resolutionDropdown.domNode, this.resolutionDropDownContainer);
                },
                _handleCloudCoverValueChanged: function (value) {
                    this.currentCloudCoverValueObj = value;
                    if (value == null) {
                        this.cloudCoverDropdown.set("label", "Cloud Cover");
                    }
                    else {
                        this.cloudCoverDropdown.set("label", "Cloud Cover: <span style='color:blue'>" + this.currentCloudCoverValueObj.label + "</span>");
                    }
                },
                createCloudCoverDropdown: function () {
                    var params = {
                        values: [
                            {
                                label: "0%;",
                                value: 0
                            },
                            {
                                label: "10%",
                                value: 10
                            },
                            {
                                label: "20%",
                                value: 20
                            },
                            {
                                label: "30%",
                                value: 30
                            },
                            {
                                label: "40%",
                                value: 40
                            },
                            {
                                label: "50%",
                                value: 50
                            },
                            {
                                label: "60%",
                                value: 60
                            },
                            {
                                label: "70%",
                                value: 70
                            },
                            {
                                label: "80%",
                                value: 80
                            },
                            {
                                label: "90%",
                                value: 90
                            },
                            {
                                label: "100%",
                                value: 100
                            }
                        ],
                        valueChangeHandler: lang.hitch(this, this._handleCloudCoverValueChanged)
                    };
                    this.cloudCoverDropdown = this._createDropDown(params);
                    //init the empty value
                    this._handleCloudCoverValueChanged(null);
                    domConstruct.place(this.cloudCoverDropdown.domNode, this.cloudCoverDropDownContainer);
                },
                _handleSatelliteValueChanged: function (value) {
                    this.currentSatelliteValueObj = value;
                    if (value == null) {
                        this.satelliteDropdown.set("label", "Satellite");
                    }
                    else {
                        this.satelliteDropdown.set("label", "Satellite: <span style='color:blue'>" + this.currentSatelliteValueObj.label + "</span>");
                    }
                },
                createSatelliteDropdown: function () {
                    var params = {
                        values: [
                            {value: "'WV1'", label: "WorldView 1 (WV1)"},
                            {value: "'WV2'", label: "WorldView 2 (WV2)"},
                            {value: "'P1'", label: "Pleiades 1 (P1)"},
                            {value: "'QB'", label: "QuickBird (QB)"},
                            {value: "'GE1'", label: "GeoEye 1 (GE1)"},
                            {value: "'IK'", label: "IKONOS (IK)"},
                            {value: "'RE'", label: "RapidEye (RE)"},
                            {value: "'SP1'", label: "SPOT 1 (SP1)"},
                            {value: "'SP2'", label: "SPOT 2 (SP2)"},
                            {value: "'SP3'", label: "SPOT 3 (SP3)"},
                            {value: "'SP4'", label: "SPOT 4 (SP4)"},
                            {value: "'SP5'", label: "SPOT 5 (SP5)"},
                            {value: "'SP6'", label: "SPOT 6 (SP6)"}
                        ],
                        valueChangeHandler: lang.hitch(this, this._handleSatelliteValueChanged)
                    };
                    this.satelliteDropdown = this._createDropDown(params);
                    //init the empty value
                    this._handleSatelliteValueChanged(null);
                    domConstruct.place(this.satelliteDropdown.domNode, this.satelliteDropDownContainer);
                },
                _handleOffNadirValueChanged: function (value) {
                    this.currentOffNadirValueObj = value;
                    if (value == null) {
                        this.offNadirDropdown.set("label", "Off-Nadir");
                    }
                    else {
                        this.offNadirDropdown.set("label", "Off-Nadir: <span style='color:blue'>" + this.currentOffNadirValueObj.label + "</span>")
                    }
                },
                createOffNadirDropdown: function () {
                    var params = {
                        values: [
                            {
                                label: "5&deg;",
                                value: 5
                            },
                            {
                                label: "10&deg;",
                                value: 10
                            },
                            {
                                label: "15&deg;",
                                value: 15
                            },
                            {
                                label: "20&deg;",
                                value: 20
                            },
                            {
                                label: "25&deg;",
                                value: 25
                            },
                            {
                                label: "30&deg;",
                                value: 30
                            },
                            {
                                label: "45&deg;",
                                value: 45
                            },
                            {
                                label: "60&deg;",
                                value: 60
                            },
                            {
                                label: "75&deg;",
                                value: 75
                            },
                            {
                                label: "90&deg;",
                                value: 90
                            }
                        ],
                        valueChangeHandler: lang.hitch(this, this._handleOffNadirValueChanged)
                    };
                    this.offNadirDropdown = this._createDropDown(params);
                    //init the empty value
                    this._handleOffNadirValueChanged(null);
                    domConstruct.place(this.offNadirDropdown.domNode, this.offNadirDropDownContainer);
                },
                _createDropDown: function (params) {
                    var menu = new DropDownMenu({ style: "display: none"});
                    var clearMenuItem = new MenuItem({
                        label: "Clear",
                        onClick: lang.partial(params.valueChangeHandler, null)
                    });
                    menu.addChild(clearMenuItem);
                    for (var i = 0; i < params.values.length; i++) {
                        var menuItem = new MenuItem({
                            label: params.values[i].label,
                            onClick: lang.partial(params.valueChangeHandler, params.values[i])
                        });
                        menu.addChild(menuItem);
                    }
                    return new DropDownButton({
                        label: "",
                        dropDown: menu
                    });
                }
            });
    });