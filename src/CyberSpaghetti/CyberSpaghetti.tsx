import React, { useRef, useEffect, useSyncExternalStore } from 'react';
import { RaySystem } from './core/RaySystem.js';
import { WebGPURenderer } from './backends/webgpu/renderer.js';
import { Canvas2DRenderer } from './backends/canvas2d/renderer.js';
import TimelineProvider, { useTimeline } from '../TimelineUtils/TimelineProvider.js';
import { AssetProvider } from '../AssetManager/context/AssetProvider.js';
import { StyleProvider } from '@mtrifonov-design/pinsandcurves-design';
import ControlsProvider, { useControls } from './ControlConsole/ControlProvider.js';
import FullscreenLoader from '../FullscreenLoader/FullscreenLoader.js';


function CyberSpaghettiInterior({ width = 1920, height = 1080, timeline, controls }) {

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const raySystemRef = useRef(new RaySystem());
    const raySystem = raySystemRef.current;

    const controlsSnapshot = useSyncExternalStore(controls.subscribeInternal.bind(controls), controls.getSnapshot.bind(controls));
    const timelineProject = useSyncExternalStore(timeline.onTimelineUpdate.bind(timeline), timeline.getProject.bind(timeline));
    raySystem.update(timelineProject,controlsSnapshot); 

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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = width;
        canvas.height = height;

        

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
        backgroundColor: "var(--gray3)",
        position: "relative",
    }}>
        <canvas ref={canvasRef} style={{ 
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
         }} />
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
        <TimelineProvider>
            <ControlsProvider>
                <CyberSpaghettiExterior />
            </ControlsProvider>
        </TimelineProvider>
    </AssetProvider>;


}
