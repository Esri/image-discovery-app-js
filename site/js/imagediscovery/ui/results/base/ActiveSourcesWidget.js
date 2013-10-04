define([
    "dojo/_base/declare",
    "dojo/text!./template/ActiveSourcesWidgetTemplate.html",
    "esriviewer/ui/base/UITemplatedWidget",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/topic",
    "dojo/on",
    "dojo/_base/lang"
],
    function (declare, template, UITemplatedWidget, domConstruct, domClass, topic, on, lang) {
        return declare(
            [UITemplatedWidget],
            {
                serviceNameField: "__serviceLabel",
                templateString: template,
                postCreate: function () {
                    this.inherited(arguments);
                    this.activeSourcesLookup = {};
                    this.processFilterFunctionsAgainstItemCallback = lang.hitch(this, this.itemIsInActiveService);
                },
                initListeners: function () {
                    this.inherited(arguments);
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.RESULT.CLEAR, lang.hitch(this, this.clearSources));
                },
                clearSources: function () {
                    this.activeSourcesLokup = {};
                    domConstruct.empty(this.activeSourcesList);
                    topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.REMOVE_FILTER_FUNCTION, this.processFilterFunctionsAgainstItemCallback);

                },
                /**
                 * adds query layer controller entry to the active sources widget
                 * @param queryLayerController
                 */
                addQueryLayerControllerEntry: function (queryLayerController) {
                    if (queryLayerController && queryLayerController.label) {
                        var container = domConstruct.create("li", {className: "activeSourceServiceEntry defaultTextColor"});
                        var lblNode = domConstruct.create("span", {className: "activeSourceServiceLbl", innerHTML: queryLayerController.label});
                        var checkedUncheckedNode = domConstruct.create("div", {className: "activeSourceServiceIcon commonIcons16 success"});
                        domConstruct.place(checkedUncheckedNode, container);
                        domConstruct.place(lblNode, container);
                        domConstruct.place(container, this.activeSourcesList);
                        this.activeSourcesLookup[queryLayerController.label] = queryLayerController.label;
                        on(container, "click", lang.hitch(this, this.handleContainerToggle, {sourceValue: queryLayerController.label, icon: checkedUncheckedNode, queryLayerController: queryLayerController}))
                    }
                },
                /**
                 * toggles the active sources container
                 * @param params
                 */
                handleContainerToggle: function (params) {
                    if (params && params.icon && params.queryLayerController) {
                        if (domClass.contains(params.icon, "success")) {
                            domClass.remove(params.icon, "success");
                            domClass.add(params.icon, "delete");
                            delete this.activeSourcesLookup[params.sourceValue];
                        }
                        else {
                            domClass.add(params.icon, "success");
                            domClass.remove(params.icon, "delete");
                            this.activeSourcesLookup[params.sourceValue] = params.sourceValue;
                        }
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.RELOAD_FILTER_FUNCTION, this.processFilterFunctionsAgainstItemCallback);
                    }
                },
                itemIsInActiveService: function (item) {
                    return this.activeSourcesLookup[item[this.serviceNameField]] != null;
                }

            });
    });