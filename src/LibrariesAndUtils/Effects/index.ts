
import * as exampleCircleEffect from "./ExampleCircle";
import * as circleSDFEffect from "./CircleSDF";
import * as bandsSDFEffect from "./BandsShadeSDF";
import * as bands2SDFEffect from "./BandsShade2SDF";
import * as patternSDFEffect from "./PatternShadeSDF";
import * as defaultBGEffect from "./DefaultBG";
import * as sinDistortSDFEffect from "./SinDistortSDF";
import * as heartSDFEffect from "./HeartSDF";
import * as lineSDFEffect from "./LineSDF";
import * as shinyShadeSDFEffect from "./shinyShadeSDF";
import * as caleidoShadeSDFEffect from "./caleidoShadeSDF";
import * as shutterShadeEffect from "./shutterShade";
import * as transformEffect from "./transform";
import * as textSDFEffect from "./TextSDF";
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
    if (effectName === "patternShadeSDF") {
        return patternSDFEffect.createEffect(effectInstanceId);
    }
    if (effectName === "defaultBG") {
        return defaultBGEffect.createEffect(effectInstanceId);
    }
    if (effectName === "sinDistortSDF") {
        return sinDistortSDFEffect.createEffect(effectInstanceId);
    }
    if (effectName === "heartSDF") {
        return heartSDFEffect.createEffect(effectInstanceId);
    }
    if (effectName === "lineSDF") {
        return lineSDFEffect.createEffect(effectInstanceId);
    }
    if (effectName === "shinyShadeSDF") {
        return shinyShadeSDFEffect.createEffect(effectInstanceId);
    }
    if (effectName === "caleidoShadeSDF") {
        return caleidoShadeSDFEffect.createEffect(effectInstanceId);
    }
    if (effectName === "shutterShade") {
        return shutterShadeEffect.createEffect(effectInstanceId);
    }
    if (effectName === "transform") {
        return transformEffect.createEffect(effectInstanceId);
    }
    if (effectName === "textSDF") {
        return textSDFEffect.createEffect(effectInstanceId);
    }
    if (effectName === "BandsShade2SDF") {
        return bands2SDFEffect.createEffect(effectInstanceId);
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
    if (effectName === "patternShadeSDF") {
        return patternSDFEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "defaultBG") {
        return defaultBGEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "sinDistortSDF") {
        return sinDistortSDFEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "heartSDF") {
        return heartSDFEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "lineSDF") {
        return lineSDFEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "shinyShadeSDF") {
        return shinyShadeSDFEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "caleidoShadeSDF") {
        return caleidoShadeSDFEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "shutterShade") {
        return shutterShadeEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "transform") {
        return transformEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "textSDF") {
        return textSDFEffect.deleteEffect(effectInstanceId);
    }
    if (effectName === "BandsShade2SDF") {
        return bands2SDFEffect.deleteEffect(effectInstanceId);
    }
    throw new Error(`Effect ${effectName} not found`);
}

const effectsList = [
    "exampleCircle",
    "CircleSDF",
    "BandsShadeSDF",
    "patternShadeSDF",
    "defaultBG",
    "sinDistortSDF",
    "heartSDF",
    "lineSDF",
    "shinyShadeSDF",
    "caleidoShadeSDF",
    "shutterShade",
    "transform",
    "textSDF",
    "BandsShade2SDF",
];

export { createEffect, deleteEffect, effectsList };