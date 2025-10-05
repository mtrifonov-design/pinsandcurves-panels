import React, { useState, useEffect } from "react";
import { SceneObject } from "../reduceStateToSceneObjects";
import { processPointerDown, processPointerMove, processPointerUp, isPointInRect } from "./processPointerEvents";

const handleHover = (canvas: HTMLCanvasElement, position: {x: number, y: number}, reducedSceneObjects: SceneObject[]) => {
    const hitObjs = reducedSceneObjects.filter(obj => isPointInRect(position, obj.geometry))
    .sort((a,b) => (b.zIndex || 0) - (a.zIndex || 0));
    const winner = hitObjs[0];
    if (winner && winner.cursor && canvas && canvas.style.cursor !== winner.cursor) {
        canvas.style.cursor = winner.cursor;
    } else if ((!winner || !winner.cursor) && canvas && canvas.style.cursor !== "default") {
        canvas.style.cursor = "default";
    }
};

function useInteraction(canvasRef: React.RefObject<HTMLCanvasElement>, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[]) {
    // Implement interaction logic here
    const [canvasCapture, setCanvasCapture] = useState(false);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handlePointerDown = (e: PointerEvent) => {
            // if middle mouse button pressed, return
            if (e.button === 1) return;
            // if right click, return
            if (e.button === 2) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            processPointerDown({x,y}, state, updateState, reducedSceneObjects);
            setCanvasCapture(true);
        };
        const handlePointerMove = (e: PointerEvent) => {
            //if (!canvasCapture) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            processPointerMove({x,y}, state, updateState, reducedSceneObjects);
            handleHover(canvas, {x,y}, reducedSceneObjects);
        };
        const handlePointerUp = (e: PointerEvent) => {
            if (!canvasCapture) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            processPointerUp({x,y}, state, updateState, reducedSceneObjects);
            setCanvasCapture(false);
        };

        canvas.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            canvas.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [canvasRef, state, updateState, reducedSceneObjects, canvasCapture]);
}

export default useInteraction;