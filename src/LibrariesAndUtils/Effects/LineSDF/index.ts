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
        signalsToCreate: [`${instanceId}_signal1`, `${instanceId}_signal2`, `${instanceId}_signal3`, `${instanceId}_signal4`, `${instanceId}_signal5`],
        effectSignature: {
            instanceId,
            effectName: "lineSDF",
            exportChannels: {
                sdf: true,
                color: true,
            },
            signals: {
                radius: `${instanceId}_signal1`,
                AposX: `${instanceId}_signal2`,
                AposY: `${instanceId}_signal3`,
                BposX: `${instanceId}_signal4`,
                BposY: `${instanceId}_signal5`,
            }
        }
    }
}

function deleteEffect(instanceId: string) {
    return {
        assetsToDelete: [instanceId+".graphics"],
        signalsToDelete: [`${instanceId}_signal1`, `${instanceId}_signal2`, `${instanceId}_signal3`, `${instanceId}_signal4`, `${instanceId}_signal5`],
    }
}

export { createEffect, deleteEffect };