import { build, Global, GlobalSignature, Program, Texture, TextureSignature, Use, Vertex, VertexSignature } from "../NectarGL/Builder";
import { CompositionDescription, GraphicAsset } from "./types";


function buildGraphics(graphicsAssetsEntries: [string, GraphicAsset][], compDesc: CompositionDescription, viewportRenderer: (s: any) => any) {
    const effectInstanceIds = [];
    for (const layer of compDesc.layers) {
        for (const effect of layer.effects) {
            effectInstanceIds.push(effect.instanceId);
        }
    };
    //console.log("buildGraphics")
    const gfx = build((ref: any) => {
        const resources = {
        };
        const __canvasSig = TextureSignature({
            type: "RGBA8",
            size: [compDesc.canvasDimensions[0], compDesc.canvasDimensions[1]],
        });
        const __sdfSig = TextureSignature({
            type: "RGBA32F",
            size: [compDesc.canvasDimensions[0], compDesc.canvasDimensions[1]],
        });
        const __compositionGlobalSig = GlobalSignature({
            screen: 'vec2',
            canvas: 'vec2',
            playheadPosition: 'float',
            numberOfFrames: 'float',
            TOTAL_FRAME: 'int',
            exampleSignal: 'float',
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
        let inputSDFName = "__initialSDF";
        const externalBundle = {
            inputTexture: ref(inputName),
            inputSDFTexture: ref(inputSDFName),
            compositionGlobal: ref("__compositionGlobal"),
            quad: ref("__quad"),
            canvasSig: ref("__canvasSig"),
            sdfSig: ref("__sdfSig"),
            compositionGlobalSig: ref("__compositionGlobalSig"),
            quadSig: ref("__quadSig")
        }
        const __initialInput = Texture({
            signature: ref("__canvasSig")
        });
        const __initialSDF = Texture({
            signature: ref("__sdfSig")
        });
        for (const instanceId of effectInstanceIds) {
            const foundAssetEntry = graphicsAssetsEntries.find(([id, asset]) => {
                if (!id.endsWith(".graphics")) return false;
                const processedId = id.replace(".graphics", "");
                return processedId === instanceId;
            });
            if (foundAssetEntry) {
                if (!foundAssetEntry[0].endsWith(".graphics")) continue;
                const effect = compDesc.layers.flatMap(l => l.effects).find(e => e.instanceId === instanceId);
                if (!effect) continue;
                const sig = {};
                for (const signalName in effect.signals) {
                    sig[signalName] = "float";
                }
                resources[instanceId +"_signalSig"] = GlobalSignature(sig);
                const signals = Global({
                    signature: ref(instanceId +"_signalSig"),
                    exportName: instanceId +"_signals"
                })
                resources[instanceId +"_signals"] = signals;
                externalBundle["signals"] = ref(instanceId +"_signals");
                externalBundle["signalsSig"] = ref(instanceId +"_signalSig");
                const processedId = foundAssetEntry[0].replace(".graphics", "");
                resources[processedId] = Use(foundAssetEntry[1].source,{...externalBundle});
                if (effect.exportChannels && effect.exportChannels.color) {
                    inputName = processedId + "_out";
                    externalBundle.inputTexture = ref(inputName);
                }
                if (effect.exportChannels && effect.exportChannels.sdf) {
                    inputSDFName = processedId + "_sdfOut";
                    externalBundle.inputSDFTexture = ref(inputSDFName);
                }
            }
        }

        const __exportTexture = Texture({
            signature: ref("__canvasSig"),
            exportName: "exportTexture",
            drawOps: [{
                program: ref("__putTextureProgram"),
                vertex: ref("__quad"),
                globals: {},
                textures: {
                    src: externalBundle.inputTexture
                },
            }]
        });
        const __putTextureProgram = Program({
            vertexShader: `
                out vec2 uv;
                void main() {
                    gl_Position = vec4(position, 0.0, 1.0);
                    uv = position * 0.5 + 0.5;
                }
            `,
            fragmentShader: `
                in vec2 uv;
                void main() {
                    outColor= texture(src, uv);
                }
            `,
            textures: {
                src: {
                    filter: "linear",
                    wrap: "repeat"
                }
            },
            vertexSignature: ref("__quadSig"),
            globalSignatures: {},
        })

        const __viewportRenderer = viewportRenderer(externalBundle);
        return {
            __canvasSig,
            __sdfSig,
            __initialInput,
            __viewportRenderer,
            __compositionGlobalSig,
            __compositionGlobal,
            __quadSig,
            __quad,
            __putTextureProgram,
            __exportTexture,
            __initialSDF,
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
    currentSourceId += JSON.stringify(compDesc);
    registry.currentSourceId = currentSourceId;

    return {
        gfx,
        registry
    };
}

export default buildGraphics;