import CachedStream from "./CachedStream";

const assetsStream = new CachedStream();
function assetsStreamReducer(instanceId: string) {
    assetsStream.updateStream([{
        resource: "externalInputTexture",
        type: "setTextureData",
        payload: ["asset://"+instanceId+".png"]
    }], "assetsLoaded");
    return assetsStream.getStream();
}

export default assetsStreamReducer;

