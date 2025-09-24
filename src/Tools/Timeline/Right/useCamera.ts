import { produce } from "immer";
import React, { useEffect, useMemo, useState } from "react";

const updateViewport = ({
    canvasRef,
    mode,
    anchorX,
    currentX,
    zoom,
    anchorViewport,
    anchorScreen,
    updateState,
    state,
}: {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    mode: "none" | "panning" | "zooming";
    anchorX: number;
    currentX: number;
    zoom: number;
    anchorViewport: { x: number; y: number; w: number; h: number; };
    anchorScreen: { width: number; height: number; };
    updateState: (newState: any) => void;
    state: any;
}) => {
        if (!canvasRef.current) return;
        const anchorXWorld = (anchorX / anchorScreen.width) * anchorViewport.w + anchorViewport.x;
        const currentXWorld = (currentX / anchorScreen.width) * anchorViewport.w + anchorViewport.x;
        if (mode === "panning") {
            const deltaXWorld = currentXWorld - anchorXWorld;
            const newState = produce(state, (draft: any) => {
                draft.local.data.viewport.x = anchorViewport.x - deltaXWorld;
            });
            updateState(newState);
        }
        if (mode === "zooming") {
            const newW = anchorViewport.w / zoom;
            const newX = anchorXWorld - (anchorX / anchorScreen.width) * newW;
            const newState = produce(state, (draft: any) => {
                draft.local.data.viewport.w = newW;
                draft.local.data.viewport.x = newX;
            });
            updateState(newState);
        }
}



function useCamera(canvasRef: React.RefObject<HTMLCanvasElement>, state: any, updateState: (newState: any) => void) {
    const viewport = state.local.data.viewport;
    const screen = state.local.data.screen;
    const [anchorX, setAnchorX] = useState(0);
    const [mode, setMode] = useState<"none" | "panning" | "zooming">("none");
    const [anchorViewport, setAnchorViewport] = useState(viewport);
    const [anchorScreen, setAnchorScreen] = useState(screen);

    const mouseTrackRef = React.useRef(0);
    const zoomRef = React.useRef(1);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // register if mouse wheel button is pressed, if so, we enter panning mode
        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 1) {
                setMode("panning");
                setAnchorX(e.clientX);
                setAnchorViewport(viewport);
                setAnchorScreen(screen);
            } 
        }
        const handleMouseUp = (e: MouseEvent) => {
            setMode("none");
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Control") {
                setMode("zooming");
                setAnchorX(mouseTrackRef.current);
                setAnchorViewport(viewport);
                setAnchorScreen(screen);
                zoomRef.current = 1;
            }
        }
        const handleMouseMove = (e: MouseEvent) => {
            mouseTrackRef.current = e.clientX;
        }
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Control") {
                setMode("none");
            }
        }

        switch (mode) {
            case "none":
                canvas.addEventListener("mousedown", handleMouseDown);
                window.addEventListener("keydown", handleKeyDown);
                canvas.addEventListener("mousemove", handleMouseMove);
                return () => {
                    canvas.removeEventListener("mousemove", handleMouseMove);
                    canvas.removeEventListener("mousedown", handleMouseDown);
                    window.removeEventListener("keydown", handleKeyDown);
                };
            case "panning":
                window.addEventListener("mouseup", handleMouseUp);
                return () => {
                    window.removeEventListener("mouseup", handleMouseUp);
                };
            case "zooming":
                window.addEventListener("keyup", handleKeyUp);
                return () => {
                    window.removeEventListener("keyup", handleKeyUp);
                };
        }

    }, [canvasRef, mode, viewport, screen]);

    useEffect(() => {
        if (mode === "panning") {
            const handleMouseMove = (e: MouseEvent) => {
                const currentX = e.clientX;
                updateViewport({
                    canvasRef,
                    mode,
                    anchorX,
                    currentX,
                    zoom: 1,
                    anchorViewport,
                    anchorScreen,
                    updateState,
                    state,
                })
            }
            window.addEventListener("mousemove", handleMouseMove);
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
            }
        }
        if (mode === "zooming") {
            const handleWheel = (e: WheelEvent) => {
                e.preventDefault();
                const zoomSensitivity = 0.001;
                const newZoom = (zoom: number) => Math.min(Math.max(0.1, zoom + e.deltaY * zoomSensitivity), 10);
                zoomRef.current = newZoom(zoomRef.current);
                updateViewport({
                    canvasRef,
                    mode,
                    anchorX,
                    currentX: 0,
                    zoom: zoomRef.current,
                    anchorViewport,
                    anchorScreen,
                    updateState,
                    state,
                })
            }
            window.addEventListener("wheel", handleWheel, { passive: false });
            return () => {
                window.removeEventListener("wheel", handleWheel);
            }
        }
    }, [mode, anchorX, anchorViewport, anchorScreen, canvasRef, updateState, state]);

    


}

export default useCamera;