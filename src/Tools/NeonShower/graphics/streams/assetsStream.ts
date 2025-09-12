

function assetsStream() {
    return {
        versionId: "assetsLoaded",
        commands: [{
            resource: "cyberspag_showerhead",
            type: "setTextureData",
            payload: ["asset://showerhead.png"]
        }]
    };
}

export default assetsStream;