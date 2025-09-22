import { useRef, useEffect, useLayoutEffect } from "react";
import useRaf from "./useRaf";


function TimelineRightSide({ state, updateState }: { state: any; updateState: any }) {

    const canvasDimensions = useRef({ width: 0, height: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useRaf(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (canvasDimensions.current.width !== canvasRef.current.width
                || canvasDimensions.current.height !== canvasRef.current.height) {
                canvasRef.current.width = canvasDimensions.current.width;
                canvasRef.current.height = canvasDimensions.current.height;
            }
            if (ctx) {
                console.log(canvasRef.current.width, canvasRef.current.height);
                //ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.fillStyle = "#0f0";
                ctx.fillRect(10, 10, 100, 100);
            }
        }
    }, true);

    useLayoutEffect(() => {
        // here we resize the canvas using a resize observer
        if (canvasRef.current) {
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.contentBoxSize) {
                        const width = entry.contentRect.width;
                        const height = entry.contentRect.height;
                        if (canvasRef.current) {
                            canvasDimensions.current = { width, height };
                        }
                    }
                }
            });
            resizeObserver.observe(canvasRef.current);
            return () => {
                resizeObserver.disconnect();
            }
        }
    }, []);

    return <div>
        <canvas ref={canvasRef} style={{width:"100%",height:"100vh",backgroundColor:"#222"}}></canvas>
    </div>;
}

export default TimelineRightSide;