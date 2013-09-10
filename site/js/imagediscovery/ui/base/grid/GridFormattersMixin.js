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
                /**
                 * formats the zoom to icon column
                 * @param object
                 * @param value
                 * @param node
                 * @param option
                 */

                zoomToIconFormatter: function (object, value, node, option) {
                    var zoomIcon = domConstruct.create("div", {title: "Zoom To", className: "imageResultsZoomToIcon commonIcons16 magnifyingGlass"});
                    on(zoomIcon, "click", lang.hitch(this, this.handleZoomToResult, object));
                    domConstruct.place(zoomIcon, node);
                },

                /**
                 * formats the thumbnail checkbox
                 * @param object
                 * @param value
                 * @param node
                 * @param option
                 */
                thumbnailCheckboxFormatter: function (object, value, node, option) {
                    var checkbox = new CheckBox({name: "showThumbNail", checked: object.showThumbNail, title: "Toggle Thumbnail", disabled: this.thumbnailToggleDisabled});
                    checkbox.on("change", lang.hitch(this, this.handleShowThumbNailToggle, object));
                    domConstruct.place(checkbox.domNode, node);
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

                /**
                 * formats date rows in the result grid
                 * @param value
                 * @return {*}
                 */
                dateFormatter: function (value) {
                    try {
                        if (value == "" || value == null) {
                            return null;
                        }
                        var date = new Date(value);
                        var formatter = this.displayFormats.date != null ? this.displayFormats.date : this.__defaultDisplayFormats.date;
                        return locale.format(date, {selector: "date", datePattern: formatter});
                    }
                    catch (err) {
                        return null;
                    }
                },
                /**
                 * formats a field
                 * @param fieldName
                 * @param object
                 * @param value
                 * @param node
                 * @param option
                 */
                //TODO: i don't remember how this was implemented
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
                /**
                 * gets the css style from configuration for a field
                 * @param fieldName field to retrieve the css style for
                 * @return Object css style for field. Null if there is no style
                 */
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