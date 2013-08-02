define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/on",
    "dojo/topic",
    "dojo/date/locale",
    "dijit/form/CheckBox"
],
    //this class returns formatted elements for fields in the grid
    function (declare, lang, domConstruct, domAttr, domStyle, on, topic, locale, CheckBox) {
        return declare(
            [],
            {
                //default formatters
                __defaultDisplayFormats: {
                    date: "MM/dd/yyyy"
                },
                displayFormats: {
                    date: "MM/dd/yyyy"
                },
                //zoom to icon

                zoomToIconFormatter: function (object, value, node, option) {
                 //   var panAndFlashIcon = domConstruct.create("div", {title: "Pan And Flash", className: "imageResultsZoomToIcon commonIcons16 globeGoTo"});
                 //   on(panAndFlashIcon, "click", lang.hitch(this, this.handlePanAndFlash, object));
                //    domConstruct.place(panAndFlashIcon, node);
                    var zoomIcon = domConstruct.create("div", {title: "Zoom To", className: "imageResultsZoomToIcon commonIcons16 magnifyingGlass"});
                    on(zoomIcon, "click", lang.hitch(this, this.handleZoomToResult, object));
                    domConstruct.place(zoomIcon, node);
                },

                //thumbnail checkbox
                thumbnailCheckboxFormatter: function (object, value, node, option) {
                    var checkbox = new CheckBox({name: "showThumbNail", checked: object.showThumbNail, title: "Toggle Thumbnail", disabled: this.thumbnailToggleDisabled});
                    checkbox.on("change", lang.hitch(this, this.handleShowThumbNailToggle, object));
                    domConstruct.place(checkbox.domNode, node);
                },
                //footprint checkbox
                /*
                footprintCheckboxFormatter: function (object, value, node, option) {
                    var checkbox = new CheckBox({name: "showFootprint", checked: object.showFootprint, title: "Toggle Footprint"});
                    checkbox.on("change", lang.hitch(this, this.handleShowFootprintToggle, object));
                    domConstruct.place(checkbox.domNode, node);
                },
                */
                //info icon
                infoIconFormatter: function (object, value, node, option) {
                    var source;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET_BY_ID, object.queryControllerId, function (cont) {
                        source = cont.layer.url;
                    });
                    var infoIcon = domConstruct.create("div", {className: "imageResultsInfoIcon commonIcons16 information", title: source });
                    on(infoIcon, "click", lang.hitch(this, this.handleShowInformation, object));
                    domConstruct.place(infoIcon, node);
                },
                //can convert to hash
                domainFormatter: function (codedValues, value) {
                    for (var i = 0; i < codedValues.length; i++) {
                        if (codedValues[i].code === value) {
                            return codedValues[i].name;
                        }
                    }
                    return value;
                },
                //format doubles. float precision is read from json configuration
                doubleFormatter: function (value) {
                    if (value != null && !(typeof value == "string")) {
                        return value.toFixed(this.floatPrecision);
                    }
                    return null;
                },
                //format dates. date format is read from json configuration
                dateFormatter: function (value) {
                    try {
                        var date = new Date(value);
                        var formatter = this.displayFormats.date != null ? this.displayFormats.date : this.__defaultDisplayFormats.date;
                        return locale.format(date, {selector: "date", datePattern: formatter});
                    }
                    catch (err) {
                        return null;
                    }
                },
                definedResultFieldFormatter: function (fieldName, object, value, node, option) {
                    var formatters = this.fieldsFormattersByQueryControllerId[object.queryControllerId];
                    var formatter;
                    var nodeStyle = this.getNodeStyleFromFieldName(fieldName);
                    if (formatters && (formatter = formatters[fieldName]) != null && lang.isFunction(formatters[fieldName])) {
                        var val = formatter(value);
                        domAttr.set(node, "innerHTML", val);
                    }
                    else {
                        domAttr.set(node, "innerHTML", value);
                    }
                    if (nodeStyle) {
                        domStyle.set(node, nodeStyle);
                    }
                },
                getNodeStyleFromFieldName: function (fieldName) {
                    var style = null;
                    for (var i = 0; i < this.resultFields.length; i++) {
                        if (this.resultFields[i].field === fieldName && this.resultFields[i].style != null) {
                            style = this.resultFields[i].style;
                            break;

                        }
                    }
                    return style;
                }
            });
    });