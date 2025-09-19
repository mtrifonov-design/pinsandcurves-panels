import { ControlsData } from "../../controls";
import CachedStream from "./CachedStream";


const stream = new CachedStream();
function streamReducer(state: ControlsData) {
    // stream.updateStream([{
    //     resource: "cyberspag_colorTexture",
    //     type: "setTextureData",
    //     payload: [colorBuffer]
    // }]);
    return stream.getStream();
}

export default streamReducer;
