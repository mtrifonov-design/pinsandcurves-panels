import { SceneObject } from "../reduceStateToSceneObjects";

function renderKeyframe(ctx: CanvasRenderingContext2D, obj: SceneObject) {
    ctx.fillStyle = "#E6C622";
    const { x, y, w, h } = obj.geometry;
    const scale = 0.8;
    const [oX,oY,oW,oH] = [x + w * (1- scale) / 2, y + h * (1 - scale) / 2, w * scale, h * scale];
    ctx.beginPath();
    ctx.moveTo(oX + oW / 2, oY);
    ctx.lineTo(oX + oW, oY + oH / 2);
    ctx.lineTo(oX + oW / 2, oY + oH);
    ctx.lineTo(oX, oY + oH / 2);
    ctx.closePath();
    ctx.fill();
}

export default renderKeyframe;