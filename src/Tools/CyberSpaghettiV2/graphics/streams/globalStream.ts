function globalStream() {
    return {
        versionId: "default",
        commands: [{
            resource: "cyberspag_globals",
            type: "setGlobals",
            payload: [{
                tunnelData: [-0.1, Math.sqrt(0.5), -10, 0.5],
                rayData: [0.5, 0.5, 0.2, 0.2],
                time: [0],
                colorVarianceFactor: [0.5],
                chaos: [0.5]
            }]
        }]
    };

}

export default globalStream;