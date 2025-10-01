import { exportResources, external } from "../../NectarGL/Builder";
import Main from "./graphics";


function MainGraphics() {
    return exportResources(Main({
        quad: external("quad"),
        quadSig: external("quadSig"),
        canvasSig: external("canvasSig"),
        sdfSig: external("sdfSig"),
        compositionGlobal: external("compositionGlobal"),
        compositionGlobalSig: external("compositionGlobalSig"),
        inputTexture: external("inputTexture"),
        inputSDFTexture: external("inputSDFTexture"),
        exportName: "exampleCircle",
        signals: external("signals"),
        signalsSig: external("signalsSig"),
    }));
}

function createEffect(instanceId: string) {
    return {
        assetsToCreate: [{
            id: instanceId+".graphics",
            metadata: { type: "graphics" },
            data: {
                sourceId: "start", 
                source: MainGraphics()
            }
        }],
        signalsToCreate: [`${instanceId}_signal1`, `${instanceId}_signal2`, `${instanceId}_signal3`],
        effectSignature: {
            instanceId,
            effectName: "circleSDF",
            exportChannels: {
                sdf: true,
            },
            signals: {
                radius: `${instanceId}_signal1`,
                posX: `${instanceId}_signal2`,
                posY: `${instanceId}_signal3`,
            }
        }
    }
}

function deleteEffect(instanceId: string) {
    return {
        assetsToDelete: [instanceId+".graphics"],
        signalsToDelete: [`${instanceId}_signal1`, `${instanceId}_signal2`, `${instanceId}_signal3`],
    }
}

export { createEffect, deleteEffect };