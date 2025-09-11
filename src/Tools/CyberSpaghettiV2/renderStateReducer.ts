import { ControlsData } from "./CyberSpaghettiControls";
import colorTextureStream from "./graphics/streams/colorTextureStream";
import globalStream from "./graphics/streams/globalStream";
import rayInstanceStream from "./graphics/streams/rayInstanceStream";
import assetsStream from "./graphics/streams/assetsStream";




function renderStateReducer(state: ControlsData) {
    const cyberspag_globalStream = globalStream(state);
    const cyberspag_rayInstanceStream = rayInstanceStream(state);
    const cyberspag_colorTextureStream = colorTextureStream(state);
    const cyberspag_assetsStream = assetsStream();
    const renderState = {
        cyberspag_global: cyberspag_globalStream,
        cyberspag_ray: cyberspag_rayInstanceStream,
        cyberspag_colorTexture: cyberspag_colorTextureStream,
        cyberspag_assets: cyberspag_assetsStream
    };
    return renderState;
}

export default renderStateReducer;