define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/on",
    "dojo/date/locale",
    "dijit/form/CheckBox"
],
    //this class returns formatted elements for fields in the grid
    function (declare, lang, domConstruct, domAttr, domStyle, on, locale, CheckBox) {
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
                /**
                 * formats domain values
                 * @param codedValuesHash has created from codedValues object in IMAGERY_UTILS.codedValuesDomainToHash
                 * @param value value to convert
                 * @return {*}
                 */
                domainFormatter: function (codedValuesHash, value) {
                    if (codedValuesHash[value] != null) {
                        return codedValuesHash[value];
                    }
                    return value;

                    /*
                     for (var i = 0; i < codedValues.length; i++) {
                     if (codedValues[i].code === value) {
                     return codedValues[i].name;
                     }
                     }
                     */
                },
                /**
                 * formats date rows in the result grid
                 * @param value
                 * @return {*}
                 */
                utcDateFormatter: function (value) {
                    try {
                        if (value == "" || value == null) {
                            return null;
                        }
                        var date = new Date(value);
                        date = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
                        var formatter = this.displayFormats.date != null ? this.displayFormats.date : this.__defaultDisplayFormats.date;
                        return locale.format(date, {selector: "date", datePattern: formatter});
                    }
                    catch (err) {
                        return null;
                    }
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
                    var nodeRendering = this.getNodeRenderingFromFieldName(fieldName);
                    var formattedValue = value;
                    if (formatters && (formatter = formatters[fieldName]) != null && lang.isFunction(formatters[fieldName])) {
                        formattedValue = formatter(value);
                    }
                    var treatAsLink = false;
                    if (nodeRendering) {
                        if (nodeRendering.style) {
                            domStyle.set(node, nodeRendering.style);
                        }
                        if (nodeRendering.processing) {
                            treatAsLink = (nodeRendering.processing.treatAsLink != null) ? nodeRendering.processing.treatAsLink : false;
                        }
                    }
                    if(treatAsLink){
                        formattedValue = "<a href='" + formattedValue + "'>" + formattedValue + "</a>";
                    }
                    domAttr.set(node, "innerHTML", formattedValue);

                },
                /**
                 * gets the css style from configuration for a field
                 * @param fieldName field to retrieve the css style for
                 * @return Object css style for field. Null if there is no style
                 */
                getNodeRenderingFromFieldName: function (fieldName) {
                    var style = null;
                    var processing = null;
                    for (var i = 0; i < this.resultFields.length; i++) {
                        if (this.resultFields[i].field === fieldName) {
                            style = this.resultFields[i].style;
                            processing = this.resultFields[i].processing;
                            break;
                        }
                    }
                    return {style: style, processing: processing};
                }
            });
    });