

function onCompute(unit) {
    log(JSON.parse(decodeURI(unit)));
    unit = JSON.parse(decodeURI(unit));
    return {
        "default": [
            {
                "type": "worker",
                receiver: {
                    instance_id: unit.payload,
                    modality: "iframe",
                    resource_id: "http://localhost:5174/cktest",
                },
                payload: {
                    channel: "default",
                    request: "testrequest",
                    data: "hello world"
                },
            }
        ]
    };
}