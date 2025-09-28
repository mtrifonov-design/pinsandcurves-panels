
import * as exampleCircleEffect from "./ExampleCircle";

// return a list of assets to be created, and a list of signals to be created, as well as an effect signature object
function createEffect(effectName: string, effectInstanceId: string) {
    if (effectName === "exampleCircle") {
        return exampleCircleEffect.createEffect(effectInstanceId);
    }
    throw new Error(`Effect ${effectName} not found`);

}

// return a list of assets to be deleted, and a list of signals to be deleted
function deleteEffect(effectName: string, effectInstanceId: string) {
    if (effectName === "exampleCircle") {
        return exampleCircleEffect.deleteEffect(effectInstanceId);
    }
    throw new Error(`Effect ${effectName} not found`);
}

export { createEffect, deleteEffect };