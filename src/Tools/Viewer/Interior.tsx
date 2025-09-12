import React, { useRef, useEffect, useSyncExternalStore, useState } from 'react';

import FrameSaver from './FrameSaver/FrameSaver.js';
import FrameSaverScreen from './FrameSaver/FrameSaverScreen.js';
import useTracker from '../../LibrariesAndUtils/hooks/useTracker.js';
import TimelineBar from './TimelineBar.js';

import NectarRenderer from '../../LibrariesAndUtils/NectarGL/Renderer.js';
import { TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import buildGraphics from '../../LibrariesAndUtils/CompositionBuilder/graphicsBuilder.js';
import buildControls from '../../LibrariesAndUtils/CompositionBuilder/controlsBuilder.js';
import Viewport from './graphics/main.js';
const defaultEvent = { path: "viewer-loaded", event: true }

export default function Interior({ timeline, controls, graphics, composition, images }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [renderer, setRenderer] = useState<NectarRenderer | null>(null);
    // const graphicsSnapshot: any = useSyncExternalStore(graphics.subscribeInternal.bind(graphics), graphics.getSnapshot.bind(graphics));
    // const controlsSnapshot: any = useSyncExternalStore(controls.subscribeInternal.bind(controls), controls.getSnapshot.bind(controls));
    const graphicsSnapshot = graphics.map(([id, asset]) => [id, asset.getSnapshot()] as [string, any]);
    const controlsSnapshot = controls.map(([id, asset]) => [id, asset.getSnapshot()] as [string, any]);
    const imagesSnapshot = images.map(([id, asset]) => [id, asset.getSnapshot()] as [string, any]);
    const compositionSnapshot = composition.getSnapshot();
    const timelineProject : TimelineController.Project = useSyncExternalStore(timeline.onTimelineUpdate.bind(timeline), timeline.getProject.bind(timeline));
    const [registry, setRegistry] = useState({currentSourceId: "not_initialized", instances: {}})


    const { recordEvent } = useTracker(defaultEvent);

    const [dimensions, setDimensions] = useState([1920,1080]);

    useEffect(() => {
        function resizeCanvasToFit(container, canvas) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            setDimensions([containerWidth, containerHeight])
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
    }, [canvasRef])

    const frameSaverRef = useRef(new FrameSaver({
        timeline,
        width: dimensions[0],
        height: dimensions[1],
    }));
    const frameSaver = frameSaverRef.current;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            throw new Error("WebGL2 not supported");
        }
        const r = new NectarRenderer(gl);
        setRenderer(r);
        frameSaver.attachCaptureFrame(() => r.captureTexture("exportTexture")); 
        const draw = () => {
            r.frame();
            frameSaver.frame();
            window.requestAnimationFrame(draw);
        };
        draw();
        return () => { };
    }, [frameSaver]);

    useEffect(() => {
        if (!renderer || !graphicsSnapshot || !compositionSnapshot) return;
        const { registry: newRegistry, gfx } = buildGraphics(graphicsSnapshot,compositionSnapshot, Viewport)
        if (newRegistry.currentSourceId !== registry.currentSourceId) {
            setRegistry(newRegistry);
        }
        //console.log(graphicsSnapshot)
        //console.log(gfx(""))
        frameSaver.setSize(compositionSnapshot.canvasDimensions[0], compositionSnapshot.canvasDimensions[1]);
        frameSaver.setName(compositionSnapshot.compositionName);
        renderer.setSource(registry.currentSourceId, gfx(""));
    }, [renderer, graphics, composition, registry,frameSaverRef]);

    useEffect(() => {
        if (!renderer || !controlsSnapshot || !compositionSnapshot || !imagesSnapshot) return;
        const compositionGlobalStream = {
            versionId: crypto.randomUUID(),
            commands: [
                {
                    resource: "compositionGlobal",
                    type: "setGlobals",
                    payload: [{
                        playheadPosition: [timelineProject.timelineData.playheadPosition],
                        numberOfFrames: [timelineProject.timelineData.numberOfFrames],
                        screen: [dimensions[0], dimensions[1]],
                        canvas: [compositionSnapshot.canvasDimensions[0], compositionSnapshot.canvasDimensions[1]],
                    }]
                }
            ],
        }
        const quadStream = {
            versionId: "default",
            commands: [
                {
                    resource: "quad",
                    type: "setVertices",
                    payload: [
                        {
                            position:
                                [
                                    -1, -1,
                                    1, -1,
                                    -1, 1,
                                    1, 1
                                ]
                        },
                        [
                            0, 1, 2, 2, 1, 3
                        ],
                        2
                    ]
                }
            ]
        }
        const renderState = {
            ...buildControls(controlsSnapshot, registry),
            compositionGlobal: compositionGlobalStream,
            quadStream,
        };
        renderer.attachAssets(imagesSnapshot);
        renderer.setState(registry.currentSourceId, renderState);
    }, [renderer, controls, timelineProject, frameSaver, registry, dimensions, composition, images]);

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
        <FrameSaverScreen frameSaver={frameSaver} recordEvent={recordEvent} compName={compositionSnapshot.compositionName} />
    </div>
}
