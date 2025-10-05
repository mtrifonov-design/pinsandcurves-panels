import { useRef, useEffect, useLayoutEffect, useState } from "react";
import useRaf from "./useRaf";
import reduceStateToSceneObjects, { SceneObject } from "./reduceStateToSceneObjects";
import renderSceneObjects from "./renderSceneObjects";
import { produce } from "immer";
import { trackHeight } from "./constants";
import useCamera from "./useCamera";
import useInteraction from "./useInteraction";
import usePlayhead from "./usePlayhead";
import InterpolationOverlay from "./interpolationOverlay";

function TimelineRightSide({ state, updateState }: { state: any; updateState: any }) {

    const [reducedSceneObjects,setReducedSceneObjects] = useState<SceneObject[]>([]);
    useEffect(() => {
        const objs = reduceStateToSceneObjects(state);
        setReducedSceneObjects(objs);
    }, [state]);

    //console.log(state.local.data.timelineUI.playheadPosition);
    

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    useRaf(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                renderSceneObjects(ctx, reducedSceneObjects);
            }
        }
    }, true);

    const firstResizeRef = useRef(true);
    useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            if (!containerRef.current) return;
            function resizeCanvasToFit(container, canvas) {
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                canvas.width = containerWidth;
                canvas.height = containerHeight;
                const nextState = produce(state, (draft) => {
                    draft.local.data.screen.width = containerWidth;
                    draft.local.data.screen.height = containerHeight;
                    draft.local.data.viewport.h = containerHeight / trackHeight;
                })
                updateState(nextState);
            }
            const handleResize = () => {
                if (canvasRef.current && containerRef.current) {
                    const container = containerRef.current;
                    const canvas = canvasRef.current;
                    resizeCanvasToFit(container, canvas);
                }
            }
            window.addEventListener('resize', handleResize);
            if (firstResizeRef.current) {
                handleResize();
                firstResizeRef.current = false;
            }
            return () => {
                window.removeEventListener('resize', handleResize);
            }
        }, [canvasRef, containerRef,state])

        useCamera(canvasRef, state, updateState);
        useInteraction(canvasRef, state, updateState, reducedSceneObjects);
        usePlayhead(state, updateState);


        //console.log(state.local.data.timelineUI.selectionMachineState);

    return <div  style={{backgroundColor: "var(--gray1)"}}>
        <div ref={containerRef} style={{ width: "100%", height: "calc(100vh - 24px)", overflow: "hidden", position: "relative" }}>

        <canvas ref={canvasRef} style={{width:"100%",height:"100%",position: "absolute", top: 0, left: 0, backgroundColor:"#00000080", borderRadius: "var(--borderRadiusSmall)"}}></canvas>
        <div style={{
            position: "absolute",
            top: `${trackHeight * 1.5}px`,
            right: `8px`,
        }}>
            <InterpolationOverlay state={state} updateState={updateState} />
        </div>
        </div>
    </div>;
}

export default TimelineRightSide;