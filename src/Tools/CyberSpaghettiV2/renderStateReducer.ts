import colorTextureStream from "./graphics/streams/colorTextureStream";
import globalStream from "./graphics/streams/globalStream";
import rayInstanceStream from "./graphics/streams/rayInstanceStream";




function renderStateReducer(state: any) {
    const cyberspag_globalStream = globalStream();
    const cyberspag_rayInstanceStream = rayInstanceStream();
    const cyberspag_colorTextureStream = colorTextureStream();
    const renderState = {
        cyberspag_global: cyberspag_globalStream,
        cyberspag_ray: cyberspag_rayInstanceStream,
        cyberspag_colorTexture: cyberspag_colorTextureStream
    };
    return renderState;
}

export default renderStateReducer;