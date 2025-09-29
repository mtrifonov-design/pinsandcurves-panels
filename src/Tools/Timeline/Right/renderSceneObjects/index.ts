import { SceneObject } from "../reduceStateToSceneObjects";
import renderKeyframe from "./keyframe";
import renderSelectionBox from "./selectionBox";
import renderTrack from "./track";
import renderTransformBox from "./transformBox";

const Renderers = {
    wireframe: (ctx: CanvasRenderingContext2D, obj: SceneObject) => {
        ctx.strokeStyle = obj.strokeColor || "rgba(255,0,0,0.5)";
        ctx.lineWidth = obj.strokeWidth || 1;
        ctx.beginPath();
        ctx.rect(obj.geometry.x, obj.geometry.y, obj.geometry.w, obj.geometry.h);
        ctx.stroke();
    },
    track: renderTrack,
    keyframe: renderKeyframe,
    selectionBox: renderSelectionBox,
    transformBox: renderTransformBox,
}

function renderSceneObjects(ctx: CanvasRenderingContext2D, sceneObjects: SceneObject[]) {
    sceneObjects.forEach(obj => {
        if (obj.renderer && Renderers[obj.renderer]) {
            Renderers[obj.renderer](ctx, obj);
            return;
        }
    });
}

export default renderSceneObjects;