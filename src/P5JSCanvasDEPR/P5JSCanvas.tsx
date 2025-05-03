import React, { useState } from "react";
import P5 from "./P5JSCanvasContent";
import { messageChannel, useUnit } from "../hooks";
import CONFIG from "../Config";

import { PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
import FullscreenLoader from "../FullscreenLoader/FullscreenLoader";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

const defaultSketch = `function setup() {
    createCanvas(400, 400);
}
function draw() {
    background(220);
    ellipse(200,200, 50, 50);
}
`



function addP5SketchToAssets(assets: any[]) {

    // convert default sketch to data url
    // const blob = new Blob([defaultSketch], { type: 'text/javascript' });
    // const dataUrl = URL.createObjectURL(blob);

    const p5Sketch = {
        asset_id: "P5JSSKETCH",
        asset_name: "P5JS Sketch",
        asset_type: "application/javascript",
        dataUrl: defaultSketch
    };

    if (assets.some(asset => asset.asset_id === p5Sketch.asset_id)) {
        return assets;
    }
    return [...assets, p5Sketch];
}

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

const INNER_SUBSCRIBER_ID = "P5JSCanvas_INNER"+generateId();
const OUTER_SUBSCRIBER_ID = "P5JSCanvas_OUTER"+generateId();
function P5JSCanvas() {

    const [projectReady, setProjectReady] = React.useState(false);
    const [assetsReady, setAssetsReady] = React.useState(false);
    const ready = projectReady && assetsReady;
    const [assets, setAssets] = useState([]);

    const savedBlockerId = useRef<string | null>(null);
    const unsubscribeCount = useRef(0);

    useUnit((unit: any) => {
        //console.log(unit)
        const { sender, payload } = unit;
        const { INIT, channel, request, payload: messagePayload, subscriber_id, TERMINATE, blocker_id } = payload;
        if (INIT) {
            messageChannel("ProjectState", "subscribe", undefined, OUTER_SUBSCRIBER_ID);
            messageChannel("ProjectState", "subscribe", undefined, INNER_SUBSCRIBER_ID);
            controller.current.connectToHost(() => {
                setProjectReady(true);
            });
            globalThis.CK_ADAPTER.pushWorkload({default: [{
                type: "worker",
                receiver: {
                    instance_id: "ASSET_SERVER",
                    modality: "wasmjs",
                    resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServer`,
                },
                payload: {
                    request: "subscribe",
                    payload: undefined,
                },
            }]});
            return;
        }
        
        if (TERMINATE) {
            messageChannel("ProjectState", "unsubscribe", undefined, OUTER_SUBSCRIBER_ID);
            messageChannel("ProjectState", "unsubscribe", undefined, INNER_SUBSCRIBER_ID);
            globalThis.CK_ADAPTER.pushWorkload({default: [{
                type: "worker",
                receiver: {
                    instance_id: "ASSET_SERVER",
                    modality: "wasmjs",
                    resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServer`,
                },
                payload: {
                    request: "unsubscribe",
                    payload: undefined,
                },
            }]});
            savedBlockerId.current = blocker_id;
        }

        if (sender.instance_id === "ASSET_SERVER" && request === "subscribeConfirmation") {
            const processedMessagePayload = addP5SketchToAssets(messagePayload);
            setAssets(processedMessagePayload);
            setAssetsReady(true);
            return;
        }

        if (channel === "ProjectState" && request === "projectNodeEvent") {
            if (subscriber_id === INNER_SUBSCRIBER_ID) {
                cbRef.current(payload);
            }
            if (subscriber_id == OUTER_SUBSCRIBER_ID) {
                controller.current.receive(messagePayload);
            }
        }

        if (sender.instance_id === "ASSET_SERVER" && request === "unsubscribeConfirmation") {
            unsubscribeCount.current++;
        }

        if (channel === "ProjectState" && request === "unsubscribeConfirmation") {
            unsubscribeCount.current++;
        }

        if (unsubscribeCount.current === 2) { 
            globalThis.CK_ADAPTER.pushWorkload({
                default: [{
                    type: "blocker",
                    blocker_id: savedBlockerId.current,
                    id: generateId(),
                    blocker_count: 2,
                }]
            })
        }

        if (request === 'assetEvent') {
            // remove the assets that are about to be overwritten
            let currentAssets = [...assets];
            currentAssets = currentAssets.filter((asset: any) => {
                messagePayload.map((a: any) => a.asset_id).includes(asset.asset_id);
            });
            const newAssets = [...currentAssets, ...messagePayload];
            setAssets(newAssets);
            return;
        }

    })

    const controller = useRef(
        Controller.Client(
            (e : any) => {
                messageChannel("ProjectState", "projectNodeEvent", e, OUTER_SUBSCRIBER_ID);
            }
        )
    );

    //const [cb, setCb] = useState(() => () => { });

    const cbRef = useRef(() => { });
    const cb = cbRef.current;
    const setCb = (callback: () => void) => {
        //console.log("callback is being set")
        cbRef.current = callback;
    }

    if (!ready) {
        return <FullscreenLoader />;
    }

    return <P5JSCanvasContent controller={controller} setCb={setCb} assets={assets} />;


}




function P5JSCanvasContent({ controller, setCb, assets }: { controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController, setCb: (callback: () => void) => void, assets: any[] }) {

    const projectState = useSyncExternalStore(controller.current.subscribeToProjectUpdates.bind(controller.current), controller.current.getProject.bind(controller.current));
    const projectTools = controller.current.projectTools;

    const attachMessageCallback = (callback: () => void) => {
        //console.log("callback set")
        setCb(callback);
    }

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
            }}>
            <P5
                assets={assets}
                project={projectState}
                projectTools={projectTools}
                sendMessage={(m) => globalThis.CK_ADAPTER.pushWorkload({default:m})}
                attachMessageCallback={attachMessageCallback}
                subscriber_id={INNER_SUBSCRIBER_ID}
            />
        </div>
    );
}
export default P5JSCanvas;