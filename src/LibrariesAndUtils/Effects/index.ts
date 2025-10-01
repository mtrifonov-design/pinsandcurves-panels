
import * as exampleCircleEffect from "./ExampleCircle";
import * as circleSDFEffect from "./CircleSDF";
import * as bandsSDFEffect from "./BandsShadeSDF";
import * as baseSDFEffect from "./BaseSDF";

// return a list of assets to be created, and a list of signals to be created, as well as an effect signature object
function createEffect(effectName: string, effectInstanceId: string) {
    if (effectName === "exampleCircle") {
        return exampleCircleEffect.createEffect(effectInstanceId);
    }
    if (effectName === "CircleSDF") {
        return circleSDFEffect.createEffect(effectInstanceId);
    }
    if (effectName === "BandsShadeSDF") {
        return bandsSDFEffect.createEffect(effectInstanceId);
    }
    if (effectName === "BaseSDF") {
        return baseSDFEffect.createEffect(effectInstanceId);
    }
    throw new Error(`Effect ${effectName} not found`);

}

// return a list of assets to be deleted, and a list of signals to be deleted
function deleteEffect(effectName: string, effectInstanceId: string) {
    if (effectName === "exampleCircle") {
        return exampleCircleEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "CircleSDF") {
        return circleSDFEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "BandsShadeSDF") {
        return bandsSDFEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "BaseSDF") {
        return baseSDFEffect.deleteEffect(effectInstanceId);
    }
    throw new Error(`Effect ${effectName} not found`);
}

const effectsList = [
    "exampleCircle",
    "CircleSDF",
    "BandsShadeSDF",
    "BaseSDF",
];

export { createEffect, deleteEffect, effectsList };