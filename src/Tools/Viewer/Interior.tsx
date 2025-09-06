import React, { useRef, useEffect, useSyncExternalStore, useState } from 'react';

import FrameSaver from './FrameSaver/FrameSaver.js';
import FrameSaverScreen from './FrameSaver/FrameSaverScreen.js';
import useTracker from '../../LibrariesAndUtils/hooks/useTracker.js';
import TimelineBar from './TimelineBar.js';
import build from '../../LibrariesAndUtils/NectarGL/build.js';
import compile from '../../LibrariesAndUtils/NectarGL/compile.js';
import NectarRenderer from '../../LibrariesAndUtils/NectarGL/Renderer.js';
import { TimelineController } from '@mtrifonov-design/pinsandcurves-external';
const defaultEvent = { path: "cyberspaghettiviewer-loaded", event: true }


export default function Interior({ timeline, controls, image }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [renderer, setRenderer] = useState<NectarRenderer | null>(null);
    const imageSnapshot: any = useSyncExternalStore(image.subscribeInternal.bind(image), image.getSnapshot.bind(image));
    const controlsSnapshot: any = useSyncExternalStore(controls.subscribeInternal.bind(controls), controls.getSnapshot.bind(controls));
    const timelineProject : TimelineController.Project = useSyncExternalStore(timeline.onTimelineUpdate.bind(timeline), timeline.getProject.bind(timeline));

    const { canvasWidth: width, canvasHeight: height } = controlsSnapshot;

    const { recordEvent } = useTracker(defaultEvent);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
    }, [width, height, canvasRef])

    useEffect(() => {
        function resizeCanvasToFit(container, canvas, aspectRatio) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const containerAspect = containerWidth / containerHeight;
            let dwidth, dheight;
            // if (containerAspect > aspectRatio) {
            //     dheight = containerHeight;
            //     dwidth = dheight * aspectRatio;
            // } else {
            //     dwidth = containerWidth;
            //     dheight = dwidth / aspectRatio;
            // }
            dwidth = containerWidth;
            dheight = containerHeight;
            console.log("dimensions", dwidth, dheight);
            canvas.style.width = `${dwidth}px`;
            canvas.style.height = `${dheight}px`;
            canvas.width = dwidth;
            canvas.height = dheight;
        }
        const handleResize = () => {
            if (canvasRef.current && containerRef.current) {
                const container = containerRef.current;
                const canvas = canvasRef.current;
                const aspectRatio = width / height;
                resizeCanvasToFit(container, canvas, aspectRatio);
            }
        }
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, [width, height])

    const frameSaverRef = useRef(new FrameSaver({
        timeline,
        width,
        height,
    }));
    const frameSaver = frameSaverRef.current;
    frameSaver.setSize(width, height);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        frameSaver.addCanvas(canvas);
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            throw new Error("WebGL2 not supported");
        }
        const r = new NectarRenderer(gl);
        setRenderer(r);
        const draw = () => {
            r.frame();
            window.requestAnimationFrame(draw);
        };
        draw();

        return () => { };
    }, [frameSaver]);

    useEffect(() => {
        if (!renderer || !imageSnapshot) return;
        renderer.setSource(imageSnapshot.sourceId, imageSnapshot.source);
    }, [renderer, imageSnapshot]);

    useEffect(() => {
        if (!renderer || !controlsSnapshot) return;
        const timelineStateStream = {
            versionId: crypto.randomUUID(),
            commands: [
                {
                    resource: "timeline",
                    type: "setGlobals",
                    payload: [{
                        playheadPosition: [timelineProject.timelineData.playheadPosition],
                        numberOfFrames: [timelineProject.timelineData.numberOfFrames],
                        rendering: [frameSaver.getStatus().rendering ? 1 : 0]
                    }]
                }
            ],
        }
        const renderState = {
            ...controlsSnapshot.renderState,
            timeline: timelineStateStream,
        };
        renderer.setState(controlsSnapshot.sourceId, renderState);
    }, [renderer, controlsSnapshot, timelineProject, frameSaver]);

    if (!timeline) {
        return <div>No timeline found</div>
    }

    return <div

        style={{
            width: "100vw",
            height: "100vh",
            backgroundColor: "var(--gray1)",
            position: "relative",
        }}>
        <div ref={containerRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "calc(100% - 60px)",
            }}
        >
            <canvas ref={canvasRef} style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
            }} />
        </div>

        <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "60px",
            backgroundColor: "var(--gray2)",
        }}>
            <TimelineBar timeline={timeline} />
        </div>
        <FrameSaverScreen frameSaver={frameSaver} recordEvent={recordEvent} />
    </div>
}
