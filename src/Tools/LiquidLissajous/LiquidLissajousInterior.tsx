import React, { useRef, useEffect, useSyncExternalStore } from 'react';
import { ParticleSystem } from './core/ParticleSystem.js';
import FrameSaver from './FrameSaver.js';
import FrameSaverScreen from './FrameSaverScreen';
import useTracker from '../../LibrariesAndUtils/hooks/useTracker.js';
import { WebGL2Renderer } from './backends/webgl2/renderer.js';
import TimelineBar from './TimelineBar.js';
const defaultEvent = { path: "liquidlissajousviewer-loaded", event: true }

export default function LiquidLissajousInterior({ timeline, controls }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const particleSystemRef = useRef<any>(new ParticleSystem());
    const particleSystem = particleSystemRef.current;
    const rendererRef = useRef<any>(null);

    const controlsSnapshot: any = useSyncExternalStore(controls.subscribeInternal.bind(controls), controls.getSnapshot.bind(controls));
    const timelineProject = useSyncExternalStore(timeline.onTimelineUpdate.bind(timeline), timeline.getProject.bind(timeline));

    const { width, height } = controlsSnapshot;

    particleSystem.update(controlsSnapshot, timeline);

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
            if (containerAspect > aspectRatio) {
                dheight = containerHeight;
                dwidth = dheight * aspectRatio;
            } else {
                dwidth = containerWidth;
                dheight = dwidth / aspectRatio;
            }
            canvas.style.width = `${dwidth}px`;
            canvas.style.height = `${dheight}px`;
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
        canvas.width = width;
        canvas.height = height;
        if (!rendererRef.current) {
            rendererRef.current = new WebGL2Renderer(canvas, particleSystem);
            // rendererRef.current = new WebGPURenderer(canvas, particleSystem);
            const renderer = rendererRef.current;
            rendererRef.current.init().then(() => {
                const loop = () => {
                    rendererRef.current!.draw();
                    const { rendering } = frameSaver.getStatus();
                    if (rendering && renderer.onFrameReady) {
                        renderer.onFrameReady(frameSaver.frame.bind(frameSaver));
                    }
                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
            });
        }
        return () => { };
    }, [width, height, timeline, controls, particleSystem]);

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
        <FrameSaverScreen frameSaver={frameSaver} recordEvent={recordEvent} controls={controlsSnapshot} />
    </div>
}
