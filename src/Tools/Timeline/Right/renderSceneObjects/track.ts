import { SceneObject } from "../reduceStateToSceneObjects";

function renderTrack(ctx: CanvasRenderingContext2D, obj: SceneObject) {
    const gradient = ctx.createLinearGradient(obj.geometry.x, 0, obj.geometry.x + obj.geometry.w, 0);
    gradient.addColorStop(0, "#161e36ff");
    gradient.addColorStop(0.02, "#243157ff");
    const regularColor = "#243157";
    const halloweenColor = "#4b1d00ff";
    ctx.fillStyle = regularColor;
    ctx.roundRect(obj.geometry.x + 6, obj.geometry.y + 4, obj.geometry.w - 12, obj.geometry.h - 8, 5);
    ctx.fill();
    
    // halloween only
    // ctx.strokeStyle = "#7a3b00ff";
    // ctx.lineWidth = 2;
    // ctx.roundRect(obj.geometry.x + 6, obj.geometry.y + 4, obj.geometry.w - 12, obj.geometry.h - 8, 5);
    // ctx.stroke();
}

export default renderTrack;