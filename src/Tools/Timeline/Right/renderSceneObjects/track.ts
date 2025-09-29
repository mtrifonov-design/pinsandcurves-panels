import { SceneObject } from "../reduceStateToSceneObjects";

function renderTrack(ctx: CanvasRenderingContext2D, obj: SceneObject) {
    const gradient = ctx.createLinearGradient(obj.geometry.x, 0, obj.geometry.x + obj.geometry.w, 0);
    gradient.addColorStop(0, "#161e36ff");
    gradient.addColorStop(0.02, "#243157ff");
    ctx.fillStyle = "#243157";
    ctx.roundRect(obj.geometry.x + 6, obj.geometry.y + 4, obj.geometry.w - 12, obj.geometry.h - 8, 5);
    ctx.fill();
}

export default renderTrack;