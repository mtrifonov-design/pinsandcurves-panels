import { SceneObject } from "../reduceStateToSceneObjects";

function renderFocusRange(ctx: CanvasRenderingContext2D, obj: SceneObject) {
    

    if (obj.handle_type) {
        ctx.fillStyle = "#4A5F9D";
        const x = obj.geometry.x;
        const y = obj.geometry.y;
        const w = obj.geometry.w;
        const h = obj.geometry.h;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 2);
       
        ctx.fill();
    }

    if (!obj.handle_type) {

        // Draw a rectangle that starts at 0.2 percent height and ends at 0.8 percent height
        ctx.fillStyle = "#243157";
        const x = obj.geometry.x;
        const y = obj.geometry.y + obj.geometry.h * 0.25;
        const w = obj.geometry.w;
        const h = obj.geometry.h * 0.5;
        ctx.fillRect(x, y, w, h);
    }



    
    
}

export default renderFocusRange;