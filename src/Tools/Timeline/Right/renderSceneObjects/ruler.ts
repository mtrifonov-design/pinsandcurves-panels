import { SceneObject } from "../reduceStateToSceneObjects";

function renderRuler(ctx: CanvasRenderingContext2D, obj: SceneObject) {
    if (obj.ruler_type === "background") {
        const gradient = ctx.createLinearGradient(0, obj.geometry.y, 0, obj.geometry.y + obj.geometry.h);
        gradient.addColorStop(0.1, "#161e3620");
        gradient.addColorStop(0.7, "#161e36ff");
        ctx.fillStyle = gradient;
        ctx.roundRect(obj.geometry.x + 6, obj.geometry.y + 4, obj.geometry.w - 12, obj.geometry.h - 8, 5);
        ctx.fill();
    }
    if (obj.ruler_type === "tick") {
        ctx.fillStyle = "#243157";
        const x = obj.geometry.x;
        if (x < 20) {
            let opa = (Math.round(Math.max(x * 5,0)));
            // make sure opa has two digits:
            opa = opa < 10 ? "0" + opa : opa;
            ctx.fillStyle = "#243157"+opa;
        }
        if (x > ctx.canvas.width - 20) {
            let opa = (Math.round(Math.max((ctx.canvas.width - x) * 5,0)));
            // make sure opa has two digits:
            opa = opa < 10 ? "0" + opa : opa;
            ctx.fillStyle = "#243157"+opa;
        }
        ctx.fillRect(obj.geometry.x, obj.geometry.y, obj.geometry.w, obj.geometry.h);
    }
    if (obj.ruler_type === "label") {
        ctx.fillStyle = "#94a3d0";
        let x = obj.geometry.x;
        if (x < 10) {
            let opa = (Math.round(Math.max(x * 10,0)));
            // make sure opa has two digits:
            opa = opa < 10 ? "0" + opa : opa;
            ctx.fillStyle = "#94a3d0"+opa;
        }
        x = x + obj.geometry.w;
        if (x > ctx.canvas.width - 10) {
            let opa = (Math.round(Math.max((ctx.canvas.width - x) * 10,0)));
            // make sure opa has two digits:
            opa = opa < 10 ? "0" + opa : opa;
            ctx.fillStyle = "#94a3d0"+opa;
        }
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(obj.text || "", obj.geometry.x + obj.geometry.w / 2, obj.geometry.y + 2);
    }
}

export default renderRuler;