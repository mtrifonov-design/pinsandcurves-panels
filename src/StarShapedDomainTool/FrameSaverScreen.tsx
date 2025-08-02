import React, { useEffect } from 'react';
import { Button, Icon } from '@mtrifonov-design/pinsandcurves-design';
import { useCK } from '../CK_Adapter/CK_Provider';
import { useRegisterUnitProcessor, useUnit } from '../CK_Adapter/CK_UnitProvider';
import { CK_Circuit } from '../CK_Adapter/CK_Circuit';
import FrameSaver from './FrameSaver';

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

interface FrameSaverScreenProps {
    frameSaver: FrameSaver;
    recordEvent: (event: { path: string; event: boolean }) => void;
}

export default function FrameSaverScreen({ frameSaver, recordEvent, controls }: FrameSaverScreenProps) {
    const { rendering, totalFrames, renderedFrames } = React.useSyncExternalStore(
        frameSaver.subscribe.bind(frameSaver),
        frameSaver.getStatus.bind(frameSaver),
    );

    frameSaver.setControls(controls);

    const videoEncoderAvailable = isBrowserKnownToWork();

    const { FreeWorkload } = useCK();
    useUnit((unit) => {
        return "beginRender" in unit.payload }, (unit, workload) => {
            workload.thread("default").worker(globalThis.CK_INSTANCE, {
                beginRender_response: true,
            });
            workload.dispatch();

            // const payload = unit.payload.beginRender;
            // if (payload.type === "imseq") {
            //     frameSaver.begin();
            //     recordEvent({ path: "liquidlissajous-renderframes", event: true });
            //     setDisplayOverlay(true);
            // }
            // if (payload.type === "mp4") {
            //     frameSaver.begin();
            //     recordEvent({ path: "liquidlissajous-renderframes", event: true });
            //     setDisplayOverlay(true);
            // }
            // workload.dispatch();
        }
    );

    const [displayOverlay, setDisplayOverlay] = React.useState(false);
    const registerUnitProcessor = useRegisterUnitProcessor();

    return <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "calc(100% - 60px)",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        padding: 10,
    }}>
        <Button
            onClick={async () => {
                const w = FreeWorkload();
                w.setMetadata("recording", false);
                const c = new CK_Circuit(registerUnitProcessor, w);
                await c.instance(globalThis.CK_INSTANCE).call("beginRender");
                c.complete();
                frameSaver.beginImSeq();
                recordEvent({ path: "echoknight-renderframes", event: true });
                setDisplayOverlay(true);

            }}
            text={"export image sequence"}
            iconName="animated_images"
        />
        {   videoEncoderAvailable && <Button
            onClick={async () => {
                const w = FreeWorkload();
                w.setMetadata("recording", false);
                // w.thread("default").worker(globalThis.CK_INSTANCE, {
                //     beginRender: {
                //         type: "mp4"
                //     }
                // })
                // w.dispatch();

                const c = new CK_Circuit(registerUnitProcessor, w);
                await c.instance(globalThis.CK_INSTANCE).call("beginRender");
                c.complete();
                frameSaver.beginMp4();
                recordEvent({ path: "echoknight-renderframes", event: true });
                setDisplayOverlay(true);
            }}
            text={"export as .mp4"}
            iconName="movie"
        />}
            <Button
            onClick={async () => {
                recordEvent({ path: "echoknight-saveframe", event: true });
                frameSaver.saveFrame();

            }}
            text={"export frame"}
            iconName="camera"
        />
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
