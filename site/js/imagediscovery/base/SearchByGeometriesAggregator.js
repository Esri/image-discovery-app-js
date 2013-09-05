define([
    "dojo/_base/declare",
    "dojo/topic"
],
    function (declare, topic) {
        return declare(
            [],
            {
                count: 0,
                defaultObjectIdField: "OBJECTID",
                constructor: function () {
                    this.features = [];
                    this.responses = [];
                    this.errors = [];
                },
                addResponse: function (response) {
                    this.responses.push(response);
                    if (this.isComplete()) {
                        this._joinResponses();
                    }
                    else {
                    }
                },
                addError: function (error) {
                    this.errors.push(error);
                    if (this.isComplete()) {
                        this._joinResponses();
                    }
                    else {
                    }
                },
                setCount: function (count) {
                    this.count = count;
                },
                isComplete: function () {
                    return (this.errors.length + this.responses.length) === this.count;
                },
                //joins all of the query responses into a single response with a features array
                _joinResponses: function () {
                    var objectIdField;
                    var catalogLayer;
                    topic.publish(IMAGERY_GLOBALS.EVENTS.LAYER.GET_CATALOG_LAYER, function (lyr) {
                        catalogLayer = lyr;
                    });
                    if (catalogLayer != null) {
                        objectIdField = catalogLayer.objectIdField;
                    }
                    else {
                        objectIdField = this.defaultObjectIdField;
                    }
                    this.features = [];
                    var idLookup = {};
                    var currentResponse;
                    var currentFeature;
                    for (var i = 0; i < this.responses.length; i++) {
                        currentResponse = this.responses[i];

                        for (var j = 0; j < currentResponse.features.length; j++) {
                            currentFeature = currentResponse.features[j];
                            if (idLookup[currentFeature.attributes[objectIdField]] == null) {
                                idLookup[currentFeature.attributes[objectIdField]] = currentFeature.attributes[objectIdField];
                                this.features.push(currentFeature);
                            }
                        }
                    }
                }
            });
    });