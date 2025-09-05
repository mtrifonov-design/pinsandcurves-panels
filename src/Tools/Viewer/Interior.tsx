import React, { useRef, useEffect, useSyncExternalStore } from 'react';

import FrameSaver from './FrameSaver/FrameSaver.js';
import FrameSaverScreen from './FrameSaver/FrameSaverScreen.js';
import useTracker from '../../LibrariesAndUtils/hooks/useTracker.js';
import TimelineBar from './TimelineBar.js';
import build from '../../LibrariesAndUtils/NectarGL/build.js';
import compile from '../../LibrariesAndUtils/NectarGL/compile.js';
const defaultEvent = { path: "cyberspaghettiviewer-loaded", event: true }


export default function Interior({ timeline, controls, image }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<any>(null);
    const imageSnapshot: any = useSyncExternalStore(image.subscribeInternal.bind(image), image.getSnapshot.bind(image));
    const controlsSnapshot: any = useSyncExternalStore(controls.subscribeInternal.bind(controls), controls.getSnapshot.bind(controls));
    const timelineProject = useSyncExternalStore(timeline.onTimelineUpdate.bind(timeline), timeline.getProject.bind(timeline));

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
            const setup = async () => {
                const gfx_raw = await build("/cyberspaghetti/main.nectargl", {
                    base: "http://localhost:3000"
                })
                const gl = canvas.getContext("webgl2");
                if (!gl) throw new Error("WebGL2 not supported");
                const gfx = compile(gfx_raw, gl);
                gfx.resources.get("raytunnel_quad").setVertices(
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
                );
                gfx.setScreen("out");
                gfx.resources.get("v").setVertices(
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
                );
                let frame = 0;
                let instances = [];
                const colorStops = [

                    {
                        r: .0,
                        g: 0.0,
                        b: 0.0,
                        pos: 0
                    },
                    {
                        r: 1.0,
                        g: 1.0,
                        b: 0.0,
                        pos: 0.4
                    },
                    {
                        r: 1.0,
                        g: 1.0,
                        b: 0.0,
                        pos: 0.5
                    },
                    {
                        r: 1,
                        g: 180 / 255,
                        b: 0.,
                        pos: 0.6
                    },
                    {
                        r: 1.,
                        g: 100 / 255,
                        b: 0.0,
                        pos: 0.7
                    },
                    {
                        r: 1.,
                        g: 0,
                        b: 0.0,
                        pos: .8
                    },
                    {
                        r: 0.,
                        g: 0,
                        b: 0.0,
                        pos: .9
                    },
                    {
                        r: 0.,
                        g: 0,
                        b: 0.0,
                        pos: 1.
                    },
                ];
                // array filled with 100 zeros
                const colorBuffer = new Float32Array(100 * 4);
                // fill colorstops in first part
                for (let i = 0; i < colorBuffer.length / 4; i++) {
                    const pos = i / (colorBuffer.length / 4);
                    for (let j = 0; j < colorStops.length; j++) {
                        let nextIdx = colorStops.length - 1;;
                        if (pos <= colorStops[j].pos) {
                            nextIdx = j;
                            const currentIdx = nextIdx - 1 < 0 ? 0 : nextIdx - 1;
                            const next = colorStops[nextIdx];
                            const current = colorStops[currentIdx];
                            const relativePos = (pos - current.pos) / (next.pos - current.pos);
                            console.log(pos, current.pos, next.pos);
                            colorBuffer[i * 4] = current.r + relativePos * (next.r - current.r);
                            colorBuffer[i * 4 + 1] = current.g + relativePos * (next.g - current.g);
                            colorBuffer[i * 4 + 2] = current.b + relativePos * (next.b - current.b);
                            colorBuffer[i * 4 + 3] = current.pos + relativePos * (next.pos - current.pos);
                            //console.log(pos, colorBuffer[i * 4], colorBuffer[i * 4 + 1], colorBuffer[i * 4 + 2]);
                            break;
                        }

                    };
                }
                function draw() {
                    instances = [];
                    for (let i = 0; i < 100; i++) {
                        instances.push(Math.random());
                    }
                    frame++;
                    gfx.resources.get("g").setGlobals({
                        screenSize: [canvas.width, canvas.height],
                        blurScale: [4]
                    });
                    gfx.resources.get("raytunnel_colorTex").setTextureData(colorBuffer);
                    gfx.resources.get("raytunnel_global").setGlobals({
                        tunnelData: [-0.1, Math.sqrt(0.5), 100, 0],
                        rayData: [1, 0.01, 0.2, 0.2],
                        time: [frame],
                        colorVarianceFactor: [0.6],
                        chaos: [0.5]
                    });
                    gfx.resources.get("raytunnel_ray").setInstanceData(
                        {
                            seed: instances
                        }
                        , instances.length);
                    gfx.resources.get("out").updateTextureData();
                    gfx.refreshScreen();
                    requestAnimationFrame(draw);
                };
                draw();
            };
            setup();
        }
        return () => { };
    }, [width, height, timeline, controls]);

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
