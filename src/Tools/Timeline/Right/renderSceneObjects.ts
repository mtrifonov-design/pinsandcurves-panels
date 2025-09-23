import { SceneObject } from "./reduceStateToSceneObjects";

function renderSceneObjects(ctx: CanvasRenderingContext2D, sceneObjects: SceneObject[]) {
    sceneObjects.forEach(obj => {
        ctx.strokeStyle = obj.strokeColor || "gray";
        ctx.lineWidth = obj.strokeWidth || 1;
        ctx.beginPath();
        ctx.rect(obj.geometry.x, obj.geometry.y, obj.geometry.w, obj.geometry.h);
        ctx.stroke();
    });
}

export default renderSceneObjects;