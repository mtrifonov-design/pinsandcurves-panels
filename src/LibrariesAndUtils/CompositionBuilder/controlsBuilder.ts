import getSourceId from "./getSourceId";
import { ControlsAsset, SourceRegistry } from "./types";


function buildControls(controlsAssetsEntries: [string,ControlsAsset][], sourceRegistry: SourceRegistry) {
    let controls = {};
    for (const [id, asset] of controlsAssetsEntries) {
        const generatedSourceId = getSourceId(id, asset.sourceId, sourceRegistry);
        if (generatedSourceId === sourceRegistry.currentSourceId) {
            controls = { ...controls, ...asset.renderState };
        }
    }
    return controls;
}

export default buildControls;