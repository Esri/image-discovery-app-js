define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "esriviewer/base/DataLoaderSupport"
],
    function (declare, lang, topic, DataLoaderSupport) {
        return declare(
            [DataLoaderSupport],
            {
                constructor: function () {
                    this._fieldTypeLookupCache = {};
                    this.queryControllerToIdLookup = {};
                },
                /**
                 * returns object with exists flag and fieldName. fieldName is the services true field name (if the field is aliased through config)
                 * @param fieldName
                 * @param queryLayerController
                 */
                getFieldExistsAndServiceFieldName: function (fieldName, queryLayerController) {
                    var response = {exists: false, fieldName: null};
                    if (queryLayerController && queryLayerController.layer) {
                        var layer = queryLayerController.layer;
                        if (queryLayerController.serviceConfiguration && queryLayerController.serviceConfiguration.fieldMapping != null && lang.isObject(queryLayerController.serviceConfiguration.fieldMapping)) {
                            var fieldMapping = queryLayerController.serviceConfiguration.fieldMapping;
                            for (var key in fieldMapping) {
                                if (fieldMapping[key] === fieldName) {
                                    //check to make sure there isn't a field mapping configuration error and check to see that the field truly does exist on the layer
                                    if (this.getServiceFieldExists(key, layer)) {
                                        response.exists = true;
                                        response.fieldName = key;
                                        return response;
                                    }
                                }
                            }
                        }
                        if (this.getServiceFieldExists(fieldName, layer)) {
                            response.exists = true;
                            response.fieldName = fieldName;
                            return response;
                        }
                    }
                    return response;
                },
                /**
                 * checks a layer to see if the fieldname exists on the service
                 * @param fieldName
                 * @param layer
                 * @return {boolean}
                 */
                getServiceFieldExists: function (fieldName, layer) {
                    if (layer.fields) {
                        var fields = layer.fields ? layer.fields : (layer.serviceDescription ? layer.serviceDescription.fields : []);
                        var currField;
                        for (var i = 0; i < fields.length; i++) {
                            currField = fields[i];
                            if (currField.alias === fieldName || currField.name === fieldName) {
                                return true;
                            }
                        }
                    }
                    return false;
                },
                /**
                 * returns the field type for the passed fieldName in the layer. this will use fieldMapping if they exist in the query controller service configuration
                 * @param {string} fieldName
                 * @param {imagediscovery/ImageQueryLayerController} queryLayerController
                 * @return {*}
                 */
                getFieldTypeFromQueryLayerController: function (fieldName, queryLayerController) {
                    if (queryLayerController && queryLayerController.layer) {
                        if (queryLayerController.serviceConfiguration && queryLayerController.serviceConfiguration.fieldMapping != null && lang.isObject(queryLayerController.serviceConfiguration.fieldMapping)) {
                            var fieldMapping = queryLayerController.serviceConfiguration.fieldMapping;
                            for (var key in fieldMapping) {
                                if (fieldMapping[key] === fieldName) {
                                    fieldName = key;
                                }
                            }
                        }
                        var layer = queryLayerController.layer;
                        var fields = layer.fields ? layer.fields : (layer.serviceDescription ? layer.serviceDescription.fields : []);
                        if (layer && fields && fieldName) {
                            for (var i = 0; i < fields.length; i++) {
                                if (fields[i].alias === fieldName || fields[i].name === fieldName) {
                                    return fields[i].type;
                                }
                            }
                        }
                    }
                    return null;
                },
                /**
                 * loads the key properties for the passed layer
                 * @param layer
                 * @param callback
                 */
                loadKeyProperties: function (layer, callback) {
                    //try to load the keyProperties
                    var wrappedCallback = lang.hitch(this, function (layer, keyProperties) {
                        layer.keyProperties = keyProperties;
                        callback(layer);
                    }, layer);
                    var wrappedErrback = lang.hitch(this, function () {
                        callback(layer);
                    }, layer);

                    var requestQuery = "?f=json";
                    if (layer.credential && layer.credential.token != null) {
                        requestQuery += "&token=" + layer.credential.token;
                    }
                    //RICHARD RIVERA NO PROXY
                    wrappedErrback(null);
                   // this.loadProxiedJson(layer.url + "/keyProperties" + requestQuery, wrappedCallback, wrappedErrback);

                },
                /**
                 * returns key properties for a layer
                 * @param layer
                 * @param id
                 * @param callback
                 * @param errback
                 */
                getKeyPropertiesForRaster: function (layer, id, callback, errback) {
                    var requestQuery = "?f=json";
                    if (layer.credential && layer.credential.token != null) {
                        requestQuery += "&token=" + layer.credential.token;
                    }
                    var rasterInfoUrl = VIEWER_UTILS.joinUrl(layer.url, id + "/info/keyProperties" + requestQuery);
                    this.loadProxiedJson(rasterInfoUrl, callback, errback);
                },
                sortItemsIntoQueryControllerArray: function (items) {
                    var queryControllerArray = [];
                    var controllerIdToItemLookup = [];
                    var currentItem;
                    for (var i = 0; i < items.length; i++) {
                        currentItem = items[i];
                        if (controllerIdToItemLookup[currentItem.queryControllerId] == null) {
                            var itemArray = [];
                            controllerIdToItemLookup[currentItem.queryControllerId] = itemArray;
                            if (this.queryControllerToIdLookup[currentItem.queryControllerId] == null) {
                                //populate the cache
                                this.getQueryLayerControllerFromId(currentItem.queryControllerId);
                            }
                            queryControllerArray.push({items: itemArray, queryController: this.queryControllerToIdLookup[currentItem.queryControllerId]});
                        }
                        controllerIdToItemLookup[currentItem.queryControllerId].push(currentItem);
                    }
                    return queryControllerArray;
                },
                /**
                 * returns the query layer controller for a passed item (item contains queryControllerId)
                 * @param item
                 * @return {*}
                 */
                getQueryLayerControllerFromItem: function (item) {
                    return this.getQueryLayerControllerFromId(item.queryControllerId);
                },
                /**
                 * returns the queryLayerController with the passed id
                 * @param queryLayerControllerId
                 * @return {*}
                 */
                getQueryLayerControllerFromId: function (queryLayerControllerId) {
                    if (this.queryControllerToIdLookup[queryLayerControllerId]) {
                        return this.queryControllerToIdLookup[queryLayerControllerId];
                    }
                    else {
                        var queryController;
                        topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.LAYER_CONTROLLERS.GET_BY_ID, queryLayerControllerId, function (qCon) {
                            queryController = qCon;
                        });
                        this.queryControllerToIdLookup[queryLayerControllerId] = queryController;
                        return queryController;
                    }
                },
                /**
                 * returns true is the layer supports download
                 * @param layer
                 * @return {boolean|*|boolean}
                 */
                layerSupportsDownload: function (layer) {
                    return (layer != null && layer.capabilities && layer.capabilities.toLowerCase().indexOf(("download")) > -1);

                },
                /**
                 * takes in an array, sorts by type and only contains unique values for each type
                 * @param ary
                 * @return {*}
                 */
                toUniqueValueArray: function (ary) {
                    var prim = {"boolean": {}, "number": {}, "string": {}}, obj = [];
                    return ary.filter(function (x) {
                        var t = typeof x;
                        return (t in prim) ?
                            !prim[t][x] && (prim[t][x] = 1) :
                            obj.indexOf(x) < 0 && obj.push(x);
                    });
                },
                getDomainValueFromCode: function (codedValues, code) {
                    for (var i = 0; i < codedValues.length; i++) {
                        if (codedValues.code === code) {
                            return codedValues.name;
                        }
                    }
                    return code;
                },
                codedValuesDomainToHash: function (codedValues) {
                    var hash = {};
                    for (var i = 0; i < codedValues.length; i++) {
                        hash[codedValues[i].code] = codedValues[i].name
                    }
                    return hash;
                },
                getObjectIdArrayForFeatures: function (objectIdField, featuresArray) {
                    var objectIds = [];
                    var currentId;
                    for (var i = 0; i < featuresArray.length; i++) {
                        currentId = featuresArray[i][objectIdField];
                        if (currentId != null) {
                            objectIds.push(currentId)
                        }
                    }
                    return objectIds;
                },
                getFieldTypeLookup: function (queryLayerController) {
                    if (this._fieldTypeLookupCache[queryLayerController.id] != null) {
                        return this._fieldTypeLookupCache[queryLayerController.id];
                    }
                    var fieldTypeLookup = {
                        dateLookup: {},
                        doubleLookup: {},
                        domainLookup: {}
                    };
                    var layer = queryLayerController.layer;
                    var fieldMapping = {};
                    if (queryLayerController.serviceConfiguration &&
                        queryLayerController.serviceConfiguration.fieldMapping != null &&
                        lang.isObject(queryLayerController.serviceConfiguration.fieldMapping)) {
                        fieldMapping = queryLayerController.serviceConfiguration.fieldMapping;
                    }
                    if (layer && layer.fields) {
                        //todo: put this in a hash
                        var currentField;
                        for (var i = 0; i < layer.fields.length; i++) {
                            currentField = layer.fields[i];
                            var mappedFieldName = currentField.name;
                            if (fieldMapping[mappedFieldName] != null) {
                                mappedFieldName = fieldMapping[mappedFieldName];
                            }
                            var fieldType = this.getFieldTypeFromQueryLayerController(currentField.name, queryLayerController);
                            if (fieldType === VIEWER_GLOBALS.ESRI_FIELD_TYPES.DATE) {
                                fieldTypeLookup.dateLookup[mappedFieldName] = currentField;
                            }
                            else if (fieldType === VIEWER_GLOBALS.ESRI_FIELD_TYPES.DOUBLE) {
                                fieldTypeLookup.doubleLookup[mappedFieldName] = currentField;
                            }
                            else if (currentField.domain != null && layer.fields[i].domain.codedValues != null) {
                                fieldTypeLookup.domainLookup[mappedFieldName] = currentField;
                            }
                        }
                    }
                    this._fieldTypeLookupCache[queryLayerController.id] = fieldTypeLookup;
                    return fieldTypeLookup;
                }
            });
    });