import { SceneObject } from "../reduceStateToSceneObjects";

function renderSelectionBox(ctx: CanvasRenderingContext2D, obj: SceneObject) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]);
    const { x, y, w, h } = obj.geometry;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.setLineDash([]);
}

export default renderSelectionBox;