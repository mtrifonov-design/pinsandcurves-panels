import CachedStream from "./CachedStream";

const assetsStream = new CachedStream();
function assetsStreamReducer() {
    assetsStream.updateStream([{
        resource: "cyberspag_showerhead",
        type: "setTextureData",
        payload: ["asset://showerhead.png"]
    }], "assetsLoaded");
    return assetsStream.getStream();
}

export default assetsStreamReducer;

// function assetsStream() {
//     return {
//         versionId: "assetsLoaded",
//         commands: [{
//             resource: "cyberspag_showerhead",
//             type: "setTextureData",
//             payload: ["asset://showerhead.png"]
//         }]
//     };
// }

// export default assetsStream;