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
        signalsToCreate: [`${instanceId}_signal1`,`${instanceId}_signal2`,`${instanceId}_signal3`,`${instanceId}_signal4`,`${instanceId}_signal5`],
        effectSignature: {
            instanceId,
            effectName: "transform",
            exportChannels: {
                color: true,
            },
            signals: {
                x: `${instanceId}_signal1`,
                y: `${instanceId}_signal2`,
                r: `${instanceId}_signal3`,
                scale_x: `${instanceId}_signal4`,
                scale_y: `${instanceId}_signal5`,
            }
        }
    }
}

function deleteEffect(instanceId: string) {
    return {
        assetsToDelete: [instanceId+".graphics"],
        signalsToDelete: [`${instanceId}_signal1`,`${instanceId}_signal2`,`${instanceId}_signal3`,`${instanceId}_signal4`,`${instanceId}_signal5`],
    }
}

export { createEffect, deleteEffect };