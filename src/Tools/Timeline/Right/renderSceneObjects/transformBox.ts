import { SceneObject } from "../reduceStateToSceneObjects";

function renderTransformBox(ctx: CanvasRenderingContext2D, obj: SceneObject) {
    ctx.strokeStyle = "#94a3d0";
    ctx.lineWidth = 1;
    const { x, y, w, h } = obj.geometry;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.setLineDash([]);
}

export default renderTransformBox;