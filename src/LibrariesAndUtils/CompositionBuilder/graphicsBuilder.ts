import { build, Global, GlobalSignature, Texture, TextureSignature, Use, Vertex, VertexSignature } from "../NectarGL/Builder";
import { CompositionDescription, GraphicAsset } from "./types";


function buildGraphics(graphicsAssetsEntries: [string, GraphicAsset][], compDesc: CompositionDescription, viewportRenderer: (s: any) => any) {
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
        const __canvasSig = TextureSignature({
            type: "RGBA8",
            size: [1920, 1080]
        })
        const __compositionGlobalSig = GlobalSignature({
            screen: 'vec2',
            canvas: 'vec2',
            playheadPosition: 'float',
            numberOfFrames: 'float',
        });
        const __compositionGlobal = Global({
            signature: ref("__compositionGlobalSig"),
            exportName: "compositionGlobal"
        });
        const __quadSig = VertexSignature({
            attributes: {
                position: "vec2",
            },
            maxTriangleCount: 1024,
            maxVertexCount: 1024
        });
        const __quad = Vertex({
            signature: ref("__quadSig"),
            exportName: "quad"
        });
        let inputName = "__initialInput";
        const externalBundle = {
            inputTexture: ref(inputName),
            compositionGlobal: ref("__compositionGlobal"),
            quad: ref("__quad"),
            canvasSig: ref("__canvasSig"),
            compositionGlobalSig: ref("__compositionGlobalSig"),
            quadSig: ref("__quadSig")
        }
        const __initialInput = Texture({
            signature: ref("__canvasSig")
        });
        for (const instanceId of effectInstanceIds) {
            const foundAssetEntry = graphicsAssetsEntries.find(([id, asset]) => {
                if (!id.endsWith(".graphics")) return false;
                const processedId = id.replace(".graphics", "");
                return processedId === instanceId;
            });
            if (foundAssetEntry) {
                if (!foundAssetEntry[0].endsWith(".graphics")) continue;
                const processedId = foundAssetEntry[0].replace(".graphics", "");
                resources[processedId] = Use(foundAssetEntry[1].source,externalBundle);
                inputName = processedId + "_out";
                externalBundle.inputTexture = ref(inputName);
            }
        }

        const __viewportRenderer = viewportRenderer(externalBundle);
        return {
            __canvasSig,
            __initialInput,
            __viewportRenderer,
            __compositionGlobalSig,
            __compositionGlobal,
            __quadSig,
            __quad,
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