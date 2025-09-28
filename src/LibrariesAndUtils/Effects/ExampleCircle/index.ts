import { exportResources, external } from "../../NectarGL/Builder";
import ExampleCircle from "../../StandardGraphics/exampleCircle";


function exampleCircleGraphics() {
    return exportResources(ExampleCircle({
        quad: external("quad"),
        quadSig: external("quadSig"),
        canvasSig: external("canvasSig"),
        compositionGlobal: external("compositionGlobal"),
        compositionGlobalSig: external("compositionGlobalSig"),
        inputTexture: external("inputTexture"),
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
                source: exampleCircleGraphics()
            }
        }],
        signalsToCreate: [`${instanceId}_signal1`, `${instanceId}_signal2`, `${instanceId}_signal3`],
        effectSignature: {
            instanceId,
            effectName: "exampleCircle",
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
        assetsToDelete: ["exampleCircle"],
        signalsToDelete: [`${instanceId}_signal1`, `${instanceId}_signal2`, `${instanceId}_signal3`],
    }
}

export { createEffect, deleteEffect };