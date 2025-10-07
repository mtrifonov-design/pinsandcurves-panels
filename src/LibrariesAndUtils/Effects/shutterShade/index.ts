import { exportResources, external } from "../../NectarGL/Builder";
import Main from "./graphics";


function MainGraphics() {
    return exportResources(Main({
        quad: external("quad"),
        quadSig: external("quadSig"),
        canvasSig: external("canvasSig"),
        compositionGlobal: external("compositionGlobal"),
        compositionGlobalSig: external("compositionGlobalSig"),
        inputTexture: external("inputTexture"),
        exportName: "exampleCircle",
        signals: external("signals"),
        signalsSig: external("signalsSig"),
        inputSDFTexture: external("inputSDFTexture"),
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
        signalsToCreate: [`${instanceId}_signal3`],
        effectSignature: {
            instanceId,
            effectName: "shutterShade",
            exportChannels: {
                color: true,
            },
            signals: {
                numAxes: `${instanceId}_signal3`,
            }
        }
    }
}

function deleteEffect(instanceId: string) {
    return {
        assetsToDelete: [instanceId+".graphics"],
        signalsToDelete: [`${instanceId}_signal3`],
    }
}

export { createEffect, deleteEffect };