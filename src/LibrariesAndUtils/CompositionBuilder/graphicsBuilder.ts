import { build, Texture, TextureSignature, Use } from "../NectarGL/Builder";
import { CompositionDescription, GraphicAsset } from "./types";


function buildGraphics(graphicsAssetsEntries: [string, GraphicAsset][], compDesc: CompositionDescription, viewportRenderer: (s: string) => any) {
    const effectInstanceIds = [];
    for (const layer of compDesc.layers) {
        for (const effect of layer.effects) {
            effectInstanceIds.push(effect.instanceId);
        }
    };
    console.log("buildGraphics")
    const gfx = build((ref: any) => {
        const resources = {
        };
        const __layerSig = TextureSignature({
            type: "RGBA8",
            size: [1024, 1024]
        })
        const __initialInput = Texture({
            signature: ref("__layerSig")
        });
        let inputName = "__initialInput";
        for (const instanceId of effectInstanceIds) {
            const foundAssetEntry = graphicsAssetsEntries.find(([id, asset]) => {
                if (!id.endsWith(".graphics")) return false;
                const processedId = id.replace(".graphics", "");
                return processedId === instanceId;
            });
            if (foundAssetEntry) {
                if (!foundAssetEntry[0].endsWith(".graphics")) continue;
                const processedId = foundAssetEntry[0].replace(".graphics", "");
                resources[processedId] = Use(foundAssetEntry[1].source,
                    {
                        input: ref(inputName)
                    });
                inputName = processedId + "_out";
            }
        }
        const __viewportRenderer = "test" // viewportRenderer(ref(inputName));
        return {
            __layerSig,
            __initialInput,
            //__viewportRenderer,
            ...resources
        };
    })
    const registry = {
        instances: {},
    };
    let currentSourceId = "";
    for (const [id, asset] of graphicsAssetsEntries) {
        if (!id.endsWith(".graphics")) continue;
        const processedId = id.replace(".graphics", "");
        registry.instances[processedId] = asset.sourceId;
        currentSourceId += asset.sourceId;
    }
    registry.currentSourceId = currentSourceId;

    return {
        gfx,
        registry
    };
}

export default buildGraphics;