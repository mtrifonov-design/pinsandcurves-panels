import React, { useEffect } from 'react';
import { Button, Icon } from '@mtrifonov-design/pinsandcurves-design';
import { useCK } from '../CK_Adapter/CK_Provider';
import { useUnitCallbacks } from '../AssetManager/context/AssetProvider';

function isBrowserKnownToWork(): boolean {
  const ua = navigator.userAgent;

  // Chromium-based (Chrome, Edge, Opera)
  if (/Chrome\/\d+/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua)) return true;

  // Firefox: WebCodecs is experimental and broken for VideoEncoder
  if (/Firefox/.test(ua)) return false;

  // Safari: partially supported in 17+, but inconsistent — assume no for now
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return false;

  return false;
}


// Add minimal types for frameSaver and event
interface FrameSaverStatus {
    rendering: boolean;
    totalFrames: number;
    renderedFrames: number;
}

interface FrameSaverLike {
    subscribe: (cb: () => void) => () => void;
    getStatus: () => FrameSaverStatus;
    begin: () => void;
}

interface FrameSaverScreenProps {
    frameSaver: FrameSaverLike;
    recordEvent: (event: { path: string; event: boolean }) => void;
}

export default function FrameSaverScreen({ frameSaver, recordEvent }: FrameSaverScreenProps) {
    const { rendering, totalFrames, renderedFrames } = React.useSyncExternalStore(
        frameSaver.subscribe.bind(frameSaver),
        frameSaver.getStatus.bind(frameSaver),
    );


    const videoEncoderAvailable = isBrowserKnownToWork();

    const { FreeWorkload } = useCK();
    const unitCallbackManager = useUnitCallbacks();
    useEffect(() => {
        unitCallbackManager.registerCallback("beginRender", (payload, workload) => {
            if (payload.type === "imseq") {
                frameSaver.beginImSeq();
                recordEvent({ path: "liquidlissajous-renderframes", event: true });
                setDisplayOverlay(true);
            }
            if (payload.type === "mp4") {
                frameSaver.beginMp4();
                recordEvent({ path: "liquidlissajous-renderframes", event: true });
                setDisplayOverlay(true);
            }
        }
        );
        return () => {
            unitCallbackManager.unregisterCallback("beginRender");
        }
    },[])

    const [displayOverlay, setDisplayOverlay] = React.useState(false);

    return <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        padding: 10,
    }}>
        <Button
            onClick={() => {
                const w = FreeWorkload();
                w.thread("default").worker(globalThis.CK_INSTANCE, {
                    beginRender: {
                        type: "imseq"
                    }
                })
                w.dispatch();
                //recordEvent({ path: "liquidlissajous-renderframes", event: true });
                //frameSaver.beginImSeq();
                //setDisplayOverlay(true);
            }}
            text={"export image sequence"}
            iconName="animated_images"
        />
        {   videoEncoderAvailable && <Button
            onClick={() => {
                const w = FreeWorkload();
                w.thread("default").worker(globalThis.CK_INSTANCE, {
                    beginRender: {
                        type: "mp4"
                    }
                })
                w.dispatch();
                //recordEvent({ path: "liquidlissajous-renderframes", event: true });
                //frameSaver.beginMp4();
                //setDisplayOverlay(true);
            }}
            text={"export as .mp4"}
            iconName="movie"
        />}
        {displayOverlay && <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: 30,
            color: "var(--gray6)",
            backgroundColor: "var(--gray1)",
            borderRadius: "var(--borderRadiusSmall)",
            marginLeft: 20,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 40,
        }}>
            <div style={{
                position: "absolute",
                top: 10,
                right: 10,
            }}>
                {!rendering &&
                    <Icon
                        iconName="close"
                        onClick={() => {
                            setDisplayOverlay(false);
                        }}
                    />}
            </div>
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: 10,
            }}>
                <div style={{
                    color: "var(--gray7)",
                    fontSize: 20,
                    fontWeight: 600,
                }}>
                    {
                        rendering ?
                        `Rendering: ${renderedFrames} / ${totalFrames}`
                        : "Done!"
                    }
                </div>
                <div>
                    {rendering ? "Your download will begin shortly..." : null}
                </div>
            </div>
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: 10,
            }}>
                <div>
                    If you enjoy using this tool, subscribe to our email newsletter
                    to get updates on new features and releases!
                </div>
                <Button
                    bgColor="var(--yellow3)"
                    color="var(--gray1)"
                    hoverBgColor='var(--yellow2)'
                    hoverColor='var(--gray1)'
                    onClick={() => {
                        window.open("http://eepurl.com/i6WBsQ", "_blank");
                    }}
                    text={"Subscribe to newsletter"}
                    iconName="email"
                />
            </div>
        </div>}
    </div>
}
