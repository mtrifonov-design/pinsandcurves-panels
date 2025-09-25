import React, { useState, useEffect } from "react";
import { SceneObject } from "../reduceStateToSceneObjects";
import { processPointerDown, processPointerMove, processPointerUp } from "./processPointerEvents";

function useInteraction(canvasRef: React.RefObject<HTMLCanvasElement>, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[]) {
    // Implement interaction logic here
    const [canvasCapture, setCanvasCapture] = useState(false);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handlePointerDown = (e: PointerEvent) => {
            // if middle mouse button pressed, return
            if (e.button === 1) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            processPointerDown({x,y}, state, updateState, reducedSceneObjects);
            setCanvasCapture(true);
        };
        const handlePointerMove = (e: PointerEvent) => {
            if (!canvasCapture) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            processPointerMove({x,y}, state, updateState, reducedSceneObjects);
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