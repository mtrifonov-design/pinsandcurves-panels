import React, { useRef, useEffect, useSyncExternalStore } from 'react';
import { RaySystem } from './core/RaySystem.js';
import { WebGPURenderer } from './backends/webgpu/renderer.js';
import { Canvas2DRenderer } from './backends/canvas2d/renderer.js';
import TimelineProvider, { useTimeline } from '../TimelineUtils/TimelineProvider.js';
import { AssetProvider } from '../AssetManager/context/AssetProvider.js';
import { Button, StyleProvider } from '@mtrifonov-design/pinsandcurves-design';
import ControlsProvider, { useControls } from './ControlConsole/ControlProvider.js';
import FullscreenLoader from '../FullscreenLoader/FullscreenLoader.js';
import FrameSaver from './FrameSaver.js';
import { ProjectDataStructure, TimelineController } from '@mtrifonov-design/pinsandcurves-external';

const pb = new ProjectDataStructure.ProjectBuilder();
pb.setTimelineData(900,30,45);
pb.addContinuousSignal('s1', 'Birth Rate', [0, 1]);
pb.addPin('s1', 10, 0, 'return easyLinear()');
pb.addPin('s1', 20, 1, 'return easyEaseOut()');
pb.addPin('s1', 40, 1, 'return easyLinear()');
pb.addPin('s1', 50, 0, 'return easyEaseIn()');
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


function CyberSpaghettiInterior({ width = 1920, height = 1080, timeline, controls }) {

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const raySystemRef = useRef(new RaySystem());
    const raySystem = raySystemRef.current;

    const controlsSnapshot = useSyncExternalStore(controls.subscribeInternal.bind(controls), controls.getSnapshot.bind(controls));
    const timelineProject = useSyncExternalStore(timeline.onTimelineUpdate.bind(timeline), timeline.getProject.bind(timeline));
    
    raySystem.update(timelineProject,controlsSnapshot,timeline); 

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

    },[])

    const frameSaverRef = useRef(new FrameSaver({
        timeline,
        width,
        height,
    }));
    const frameSaver = frameSaverRef.current;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = width;
        canvas.height = height;

        frameSaver.addCanvas(canvas);
        

        let renderer;

        (async () => {
              if (navigator.gpu) {
                renderer = new WebGPURenderer(canvas, raySystem);
                await renderer.init();                  // async pipeline build
              } else {
                console.warn('WebGPU not available – using Canvas2D fallback');
                renderer = new Canvas2DRenderer(canvas, raySystem);
              }
            //renderer = new Canvas2DRenderer(canvas, raySystem);

            const loop = () => {
                // seconds
                renderer.draw();
                const { rendering } = frameSaver.getStatus();
                if (rendering && renderer.onFrameReady) {
                    renderer.onFrameReady(frameSaver.frame.bind(frameSaver));
                }
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        })();

        // clean-up on unmount
        return () => { };
    }, [width, height,timeline,controls]);

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

function FrameSaverScreen({ frameSaver }) {
    const {rendering, totalFrames, renderedFrames} = useSyncExternalStore(
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
            text={"export image sequence"}
            iconName="animated_images" 
         />
        {rendering && <div style={{

            color: "var(--gray6)",
            marginLeft: 20,
        }}>
            {
            `Rendering... ${renderedFrames} / ${totalFrames}` }
        </div>}
    </div>
}

function CyberSpaghettiExterior() {
    const timeline = useTimeline();
    const controls = useControls();

    const ready = timeline && controls;
    if (!ready) {
        return <FullscreenLoader />
    }

    return <CyberSpaghettiInterior controls={controls} timeline={timeline} />


}


export default function CyberSpaghetti() {


    return <AssetProvider>
        <TimelineProvider
            defaultProject={defaultProject}
            defaultName={defaultName}
            shouldCreate ={true}
        >
            <ControlsProvider>
                <CyberSpaghettiExterior />
            </ControlsProvider>
        </TimelineProvider>
    </AssetProvider>;


}
