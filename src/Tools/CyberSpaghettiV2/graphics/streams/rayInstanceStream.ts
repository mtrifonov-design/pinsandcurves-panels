function rayInstanceStream() {

    const instances = [];
    for (let i = 0; i < 1000; i++) {
        instances.push(Math.random());
    }

    return {
        versionId: "default",
        commands: [{
            resource: "cyberspag_ray",
            type: "setInstanceData",
            payload: [{ seed: instances}, instances.length]
        }]
    }
};

export default rayInstanceStream;