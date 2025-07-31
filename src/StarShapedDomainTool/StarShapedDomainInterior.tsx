import React, { useRef, useEffect, useSyncExternalStore } from 'react';
import { Engine } from './core/Engine.js';
import FrameSaver from './FrameSaver.js';
import FrameSaverScreen from './FrameSaverScreen.js';
import useGoatCounter from '../hooks/useGoatCounter.js';
import { StarShapedDomainWipeRenderer } from './backends/webgl2/renderer.js';
import TimelineBar from './TimelineBar.js';
import { useIndex } from '../AssetManager/hooks/useIndex.js';
import { useAssets } from '../AssetManager/hooks/useAssets.js';
const defaultEvent = { path: "rippletron-loaded", event: true }

class ImageController {
    initialised = false
    data?: string;
    constructor() {}
    load(data: string) {
        this.data = data;
        this.initialised = true;
    }
    receiveUpdate(update: string) {
        this.data = update;
    }
    receiveMetadataUpdate() {}
    getSnapshot() {
        return this.data;
    }
    destroy() {
        this.data = undefined;
        this.initialised = false;
    }
    update: (u: any) => void;
    updateMetadata: (m: any) => void;
    setHooks(hooks) {
        this.update = hooks.update;
        this.updateMetadata = hooks.updateMetadata;
    }
}


export default function StarShapedDomainInterior({ timeline, controls }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Engine>(new Engine());
    const engine = engineRef.current;
    const rendererRef = useRef<any>(null);

    const controlsSnapshot: any = useSyncExternalStore(controls.subscribeInternal.bind(controls), controls.getSnapshot.bind(controls));
    const timelineProject = useSyncExternalStore(timeline.onTimelineUpdate.bind(timeline), timeline.getProject.bind(timeline));
    const { index: indexInitialized, index} = useIndex();
    const assetsList = indexInitialized ? Object.keys(index.data)
    .filter(id => index.data[id].type === 'image')
    .map(id => ({
        assetId: id,
        assetController: new ImageController(),
    })): [];
    const { initialized: assetsInitialized, assets } = useAssets(assetsList);
    const processedAssets = assetsInitialized ? Object.keys(assets).map(id => ({
        assetId: id,
        assetController: assets[id],
    })) : [];

    const { width, height } = controlsSnapshot;

    const [engineInitialized, setEngineInitialized] = React.useState(false);

    useEffect(() => {
        if (!engineInitialized) {
            engine.init().then(() => {
                setEngineInitialized(true);
            }).catch((error) => {
                console.error("Error initializing engine:", error);
            });
        }
    }, [engineInitialized, engine]);

    engine.update(controlsSnapshot, timeline, processedAssets);

    const { recordEvent } = useGoatCounter(defaultEvent);

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
            rendererRef.current = new StarShapedDomainWipeRenderer(canvas);
            const renderer = rendererRef.current;
            renderer.setup(engine);
            const loop = () => {
                renderer.draw(engine);
                const { rendering } = frameSaver.getStatus();
                if (rendering && renderer.onFrameReady) {
                    renderer.onFrameReady(frameSaver.frame.bind(frameSaver));
                }
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        }
        return () => { };
    }, [width, height, timeline, controls, engine, canvasRef.current]);

    if (!timeline) {
        return <div>No timeline found</div>
    }
    if (!engineInitialized) {
        return <div>Loading...</div>
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


export { ImageController}