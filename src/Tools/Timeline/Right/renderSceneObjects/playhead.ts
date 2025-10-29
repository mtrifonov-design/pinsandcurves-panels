import { SceneObject } from "../reduceStateToSceneObjects";

const halloweenImage = new Image();
halloweenImage.src = "/pinsandcurves-panels/emojis/skull.png";
let loaded = false;
halloweenImage.onload = () => {
    loaded = true;
    //console.log("Halloween playhead image loaded");
}



function renderPlayhead(ctx: CanvasRenderingContext2D, obj: SceneObject) {
    
    if (obj.playhead_type === "line") {
        ctx.beginPath();
        ctx.moveTo(obj.geometry.x + obj.geometry.w / 2, obj.geometry.y);
        ctx.lineTo(obj.geometry.x + obj.geometry.w / 2, obj.geometry.y + obj.geometry.h);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#1D471E";
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#429A44";
        ctx.stroke();

        // ctx.beginPath();
        // ctx.moveTo(obj.geometry.x + obj.geometry.w / 2, obj.geometry.y);
        // ctx.lineTo(obj.geometry.x + obj.geometry.w / 2, obj.geometry.y + obj.geometry.h);
        // ctx.lineWidth = 4;
        // ctx.strokeStyle = "#3e3e3eff";
        // ctx.stroke();
        // ctx.lineWidth = 2;
        // ctx.strokeStyle = "#d0d0d0ff";
        // ctx.stroke();


    }
    if (obj.playhead_type === "triangle") {
        ctx.save();
        ctx.strokeStyle = "#429A44";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 4;
        ctx.fillStyle = "#6EBD6F";
        ctx.beginPath();
        ctx.moveTo(obj.geometry.x + obj.geometry.w / 2 - 15, obj.geometry.y);
        ctx.lineTo(obj.geometry.x + obj.geometry.w / 2 + 15, obj.geometry.y);
        ctx.lineTo(obj.geometry.x + obj.geometry.w / 2, obj.geometry.y + 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // halloween style:
        // ctx.save();
        // if (loaded) {
        //     ctx.drawImage(halloweenImage, obj.geometry.x + obj.geometry.w / 2 - 18, obj.geometry.y, 36, 36);
        // }
        // ctx.restore();
    }
    
}

export default renderPlayhead;