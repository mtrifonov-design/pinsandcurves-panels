import getSourceId from "./getSourceId";
import { ControlsAsset, SourceRegistry } from "./types";


function buildControls(controlsAssetsEntries: [string,ControlsAsset][], sourceRegistry: SourceRegistry) {
    let controls = {};
    for (const [id, asset] of controlsAssetsEntries) {
        if (!id.endsWith(".controls")) continue;
        const processedId = id.replace(".controls", "");
        const generatedSourceId = getSourceId(processedId, asset.sourceId, sourceRegistry);
        //console.log(generatedSourceId, processedId, asset, sourceRegistry)
        if (generatedSourceId === sourceRegistry.currentSourceId) {
            controls = { ...controls, ...asset.renderState };
        }
    }
    return controls;
}

export default buildControls;