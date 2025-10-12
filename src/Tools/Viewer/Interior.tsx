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
import useRaf from './useRaf.js';
import { Timeline } from '../../LibrariesAndUtils/Timeline';
import interpolateSignalValue from '../../LibrariesAndUtils/InterpolateSignalValue/index.js';



export default function Interior({ timeline, controls, graphics, composition, images }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [renderer, setRenderer] = useState<NectarRenderer | null>(null);
    // const graphicsSnapshot: any = useSyncExternalStore(graphics.subscribeInternal.bind(graphics), graphics.getSnapshot.bind(graphics));
    // const controlsSnapshot: any = useSyncExternalStore(controls.subscribeInternal.bind(controls), controls.getSnapshot.bind(controls));
    const graphicsSnapshot = graphics.map(([id, asset]) => [id, asset.getSnapshot()] as [string, any]);
    const controlsSnapshot = controls.map(([id, asset]) => [id, asset.getSnapshot()] as [string, any]);
    const imagesSnapshot = images.map(([id, asset]) => [id, asset.getSnapshot()] as [string, any]);
    const compositionSnapshot = composition.getSnapshot().data;
    const timelineProjectRef = useRef(new Timeline(timeline));
    const timelineProject = timelineProjectRef.current;
    timelineProject.update(timeline);
    const [registry, setRegistry] = useState({currentSourceId: "not_initialized", instances: {}})

    //console.log("controls", controlsSnapshot);

    const { recordEvent } = useTracker(defaultEvent);

    const [dimensions, setDimensions] = useState([1920,1080]);
    const [totalFrame, setTotalFrame] = useState(0);

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
    }, [frameSaver]);

    useRaf(() => {
        if (renderer) {
            renderer.frame();
            frameSaver.frame();
            setTotalFrame(tf => tf + 1);
        }
    }, true);

    useEffect(() => {
        //console.log("graphics or composition changed", graphicsSnapshot, compositionSnapshot);
        if (!renderer || !graphicsSnapshot || !compositionSnapshot) return;
        const { registry: newRegistry, gfx } = buildGraphics(graphicsSnapshot,compositionSnapshot, Viewport)
        if (newRegistry.currentSourceId !== registry.currentSourceId) {
            setRegistry(newRegistry);
        }
        //console.log("GFX", gfx())
        frameSaver.setSize(compositionSnapshot.canvasDimensions[0], compositionSnapshot.canvasDimensions[1]);
        frameSaver.setName(compositionSnapshot.compositionName);
        renderer.setSource(registry.currentSourceId, gfx(""));
    }, [renderer, graphics, composition, registry,frameSaverRef]);

    useEffect(() => {
        if (!renderer || !controlsSnapshot || !compositionSnapshot || !imagesSnapshot) return;
        const keyframes = timelineProject.data.signalKeyframes["exampleCircle_signal1"].map(kfId => timelineProject.data.keyframeData[kfId]);
        const compositionGlobalStream = {
            versionId: crypto.randomUUID(),
            commands: [
                {
                    resource: "compositionGlobal",
                    type: "setGlobals",
                    payload: [{
                        playheadPosition: [timelineProject.playheadPosition],
                        numberOfFrames: [timelineProject.data.general.numberOfFrames],
                        screen: [dimensions[0], dimensions[1]],
                        canvas: [compositionSnapshot.canvasDimensions[0], compositionSnapshot.canvasDimensions[1]],
                        exampleSignal: [interpolateSignalValue(keyframes, timelineProject.playheadPosition)],
                        TOTAL_FRAME: [totalFrame]
                    }]
                }
            ],
        }
        const signalStreamsPre = compositionSnapshot.layers.flatMap(layer => layer.effects)
            .map(effect => [effect.instanceId, effect.signals])
            .map(([instanceId, signals]) => {
                const obj = Object.entries(signals)
                .map(([signalName, signalId]) => ({
                        [signalName]: [interpolateSignalValue(timelineProject.data.signalKeyframes[signalId].map(kfId => timelineProject.data.keyframeData[kfId]), timelineProject.playheadPosition)]
                }))
                .reduce((acc, curr) => ({...acc, ...curr}), {});
                return {
                resource: `${instanceId}_signals`,
                type: "setGlobals",
                payload: [{
                    ...obj
                }]
            }});
        const signalStream = {
            versionId: crypto.randomUUID(),
            commands: signalStreamsPre,
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
        //console.log("buildControls",buildControls(controlsSnapshot, registry));
        const renderState = {
            ...buildControls(controlsSnapshot, registry),
            compositionGlobal: compositionGlobalStream,
            quadStream,
            signals: signalStream,
        };
        //console.log("RENDER STATE", renderState)
        renderer.attachAssets(imagesSnapshot);
        renderer.setState(registry.currentSourceId, renderState);
    }, [renderer, controls, timelineProject, frameSaver, registry, dimensions, composition, images,totalFrame]);

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
