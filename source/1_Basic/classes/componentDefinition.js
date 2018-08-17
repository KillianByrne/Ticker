var getComponentDefinition = function (options) {
    return {
        "id": 1,
        "componentName": "Basic",
        "componentDescription": "",
        "appArgs": {
            json: {
                "Basics": {
                    "Data": ""
                }
            },
            "schema": {
                "type": "object",
                "title": "Properties",
                "properties": {
                    "Basics": {
                        "type": "object",
                        "title": "Basics",
                        "properties": {
                            "Data": {
                                "type": "data",
                                "title": "Data Source",
								"options": {
									"hidden": true
								}
                            }
                        }
                    }
                }
            }
        }
    };
};