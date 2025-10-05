import { SceneObject } from "../reduceStateToSceneObjects";

function renderDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
    ctx.fill();
}

function renderCircle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}

function clipLeftHalf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.rect(x, y, w / 2, h);
    ctx.closePath();
    ctx.clip();
}

function clipRightHalf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    ctx.rect(x + w / 2, y, w / 2, h);
    ctx.closePath();
    ctx.clip();
}


function renderKeyframe(ctx: CanvasRenderingContext2D, obj: SceneObject) {
    ctx.fillStyle = "#E6C622";
    const { x, y, w, h } = obj.geometry;
    const scale = 0.8;
    const [oX,oY,oW,oH] = [x + w * (1- scale) / 2, y + h * (1 - scale) / 2, w * scale, h * scale];
    const easingShape = (obj as any).easingShape;
    if (easingShape.in === "diamond" && easingShape.out === "diamond") {
        renderDiamond(ctx, oX, oY, oW, oH);
        return;
    }
    if (easingShape.in === "circle" && easingShape.out === "circle") {
        renderCircle(ctx, oX, oY, oW, oH);
        return;
    }
    if (easingShape.in === "diamond" && easingShape.out === "circle") {
        ctx.save();
        clipLeftHalf(ctx, oX, oY, oW, oH);
        renderDiamond(ctx, oX, oY, oW, oH);
        ctx.restore();
        ctx.save();
        clipRightHalf(ctx, oX, oY, oW, oH);
        renderCircle(ctx, oX, oY, oW, oH);
        ctx.restore();
        return;
    }
    if (easingShape.in === "circle" && easingShape.out === "diamond") {
        ctx.save();
        clipLeftHalf(ctx, oX, oY, oW, oH);
        renderCircle(ctx, oX, oY, oW, oH);
        ctx.restore();
        ctx.save();
        clipRightHalf(ctx, oX, oY, oW, oH);
        renderDiamond(ctx, oX, oY, oW, oH);
        ctx.restore();
        return;
    }
}

export default renderKeyframe;