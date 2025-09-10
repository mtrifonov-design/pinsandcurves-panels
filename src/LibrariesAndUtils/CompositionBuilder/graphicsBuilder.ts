import { build, Texture, TextureSignature, Use } from "../NectarGL/Builder";
import { CompositionDescription, GraphicAsset } from "./types";


function buildGraphics(graphicsAssetsEntries: [string, GraphicAsset][], compDesc: CompositionDescription, viewportRenderer: (s: string) => any) {
    const effectInstanceIds = [];
    for (const layer of compDesc.layers) {
        for (const effect of layer.effects) {
            effectInstanceIds.push(effect.instanceId);
        }
    };
    const gfx = build((ref:any) => {
        const resources = {
        };
        const __layerSig = TextureSignature({
            type: "RGA8",
            size: [1024, 1024]
        })
        const __initialInput = Texture({
            signature: ref("__layerSig")
        });
        let inputName = "__initialInput";
        for (const instanceId of effectInstanceIds) {
            const foundAssetEntry = graphicsAssetsEntries.find(([id, asset]) => id === instanceId);
            if (foundAssetEntry) {
                resources[foundAssetEntry[0]] = Use({
                    resources: foundAssetEntry[1].source,
                    bindings: {
                        input: ref(inputName)
                    }
                });
                inputName = foundAssetEntry[0]+"_out";
            }
        }
        const __viewportRenderer = viewportRenderer(ref(inputName));
        return {
            __initialInput,
            __viewportRenderer,
            __layerSig,
            ...resources
        };
    })
    const registry = {
        instances: {},
    };
    let currentSourceId = "";
    for (const [id, asset] of graphicsAssetsEntries) {
        registry.instances[id] = asset.sourceId;
        currentSourceId += asset.sourceId;
    }
    registry.currentSourceId = currentSourceId;

   return {
       gfx,
       registry
   };
}

export default buildGraphics;