import { useRef, useEffect, useLayoutEffect, useState } from "react";
import useRaf from "./useRaf";
import reduceStateToSceneObjects, { SceneObject } from "./reduceStateToSceneObjects";
import renderSceneObjects from "./renderSceneObjects";
import { produce } from "immer";
import { trackHeight } from "./constants";
import useCamera from "./useCamera";
import useInteraction from "./useInteraction";

function TimelineRightSide({ state, updateState }: { state: any; updateState: any }) {

    const [reducedSceneObjects,setReducedSceneObjects] = useState<SceneObject[]>([]);
    useEffect(() => {
        const objs = reduceStateToSceneObjects(state);
        setReducedSceneObjects(objs);
    }, [state]);

    

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
            handleResize();
            return () => {
                window.removeEventListener('resize', handleResize);
            }
        }, [canvasRef, containerRef])

        useCamera(canvasRef, state, updateState);
        useInteraction(canvasRef, state, updateState, reducedSceneObjects);
        console.log(state.local.data.timelineUI.selectionMachineState);

    return <div  style={{backgroundColor: "var(--gray1)"}}>
        <div ref={containerRef} style={{ width: "100%", height: "calc(100vh - 24px)", overflow: "hidden", position: "relative" }}>
        <canvas ref={canvasRef} style={{width:"100%",height:"100%",backgroundColor:"#222"}}></canvas>
        </div>
    </div>;
}

export default TimelineRightSide;