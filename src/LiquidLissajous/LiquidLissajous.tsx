import React, { useRef, useEffect, useSyncExternalStore } from 'react';
import { ParticleSystem } from './core/ParticleSystem.js';
import { WebGPURenderer } from './backends/webgpu/renderer.js';
import TimelineProvider, { useTimeline } from '../TimelineUtils/TimelineProvider.js';
import { AssetProvider } from '../AssetManager/context/AssetProvider.js';
import { Button, StyleProvider } from '@mtrifonov-design/pinsandcurves-design';
import ControlsProvider, { useControls } from './ControlConsole/ControlProvider.js';
import FullscreenLoader from '../FullscreenLoader/FullscreenLoader.js';
import FrameSaver from './FrameSaver.js';
import { ProjectDataStructure, TimelineController } from '@mtrifonov-design/pinsandcurves-external';

const pb = new ProjectDataStructure.ProjectBuilder();
pb.setTimelineData(900, 30, 45);
pb.addContinuousSignal('s1', 'Unused Signal', [0, 1]);
pb.addContinuousSignal('cx', 'Center X', [0, 1]);
pb.addPin('cx', 0, 0, 'return easyLinear()');
pb.addPin('cx', 50, 1, 'return easyLinear()');
pb.addPin('cx', 900, 1, 'return easyLinear()');
pb.addContinuousSignal('cy', 'Center Y', [0, 1]);
pb.addPin('cy', 0, 0, 'return easyLinear()');
pb.addPin('cy', 50, 1, 'return easyLinear()');
pb.addPin('cy', 900, 1, 'return easyLinear()');
pb.setSignalActiveStatus('s1', true);
pb.setSignalActiveStatus('cx', false);
pb.setSignalActiveStatus('cy', false);
const defaultProject = () => {
    const project = pb.getProject();
    const controller = TimelineController.TimelineController.fromProject(project);
    //   controller.projectTools.updateFocusRange([0,150]);
    //   controller.projectTools.pushUpdate();
    const serialised = controller.serialize();
    return serialised;
}
const defaultName = "spaghetti.timeline"


function LiquidLissajousInterior({ width = 1920, height = 1080, timeline, controls }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const particleSystemRef = useRef<any>(new ParticleSystem());
    const particleSystem = particleSystemRef.current;
    const rendererRef = useRef<any>(null);

    const controlsSnapshot: any = useSyncExternalStore(controls.subscribeInternal.bind(controls), controls.getSnapshot.bind(controls));
    const timelineProject: any = useSyncExternalStore(timeline.onTimelineUpdate.bind(timeline), timeline.getProject.bind(timeline));

    // Update particle system each frame
    particleSystem.update(controlsSnapshot, timeline);

    useEffect(() => {
        //resize canvas to window size
        function resizeCanvasToFit(container, canvas, aspectRatio) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            const containerAspect = containerWidth / containerHeight;

            let width, height;

            if (containerAspect > aspectRatio) {
                // container is wider than canvas, limit by height
                height = containerHeight;
                width = height * aspectRatio;
            } else {
                // container is taller than canvas, limit by width
                width = containerWidth;
                height = width / aspectRatio;
            }

            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;


            // canvas.width = width;    // internal resolution (optional, depends on your needs)
            // canvas.height = height;
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

    }, [])

    const frameSaverRef = useRef(new FrameSaver({
        timeline,
        width,
        height,
    }));
    const frameSaver = frameSaverRef.current;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        frameSaver.addCanvas(canvas);


        canvas.width = width;
        canvas.height = height;

        if (!rendererRef.current) {
            rendererRef.current = new WebGPURenderer(canvas, particleSystem);
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

        // clean-up on unmount
        return () => { };
    }, [width, height, timeline, controls, particleSystem]);

    if (!timeline) {
        return <div>No timeline found</div>
    }

    return <div
        ref={containerRef}
        style={{
            width: "100vw",
            height: "100vh",
            backgroundColor: "var(--gray1)",
            position: "relative",
        }}>
        <canvas ref={canvasRef} style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
        }} />
        <FrameSaverScreen frameSaver={frameSaver} />
    </div>
}

function LiquidLissajousExterior() {
    const timeline = useTimeline();
    const controls = useControls();

    const ready = timeline && controls;
    if (!ready) {
        return <FullscreenLoader />
    }

    // check if webgpu is supported
    if (!navigator.gpu) {
        return <div style={{
            width: "100vw",
            height: "100vh",
            backgroundColor: "var(--gray1)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "var(--gray6)",
            padding: 20,
        }}>
            <div>
                <h3 style={{
                    color: "var(--gray7)",
                }}>WebGPU is not (yet) supported in this browser.</h3>
                <p style={{
                    color: "var(--gray6)",
                }}>
                    Sorry for the inconvenience! <br></br>
                    WebGPU is a new technology which is not yet supported in all major browsers,
                    but is available in the latest versions of Chrome and Edge. <br></br>

                </p>
            </div>
        </div>
    }

    return <LiquidLissajousInterior controls={controls} timeline={timeline} />
}


function FrameSaverScreen({ frameSaver }) {
    const { rendering, totalFrames, renderedFrames } = useSyncExternalStore(
        frameSaver.subscribe.bind(frameSaver),
        frameSaver.getStatus.bind(frameSaver),
    )

    return <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "60px",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 10,
    }}>
        <Button
            onClick={() => {
                frameSaver.begin();
            }}
            text={"save as frames"}
            iconName="animated_images"
        />
        {rendering && <div style={{

            color: "var(--gray6)",
            marginLeft: 20,
        }}>
            {
                `Rendering... ${renderedFrames} / ${totalFrames}`}
        </div>}
    </div>
}


export default function LiquidLissajous() {
    return <AssetProvider>
        <TimelineProvider
            defaultProject={defaultProject}
            defaultName={defaultName}
            shouldCreate={true}
        >
            <ControlsProvider>
                <LiquidLissajousExterior />
            </ControlsProvider>
        </TimelineProvider>
    </AssetProvider>;
}
