import React, { useEffect, useState } from "react";
import P5 from "./P5JSCanvas/P5JSCanvas";
import { useChannel, messageChannel, useUnit } from "./hooks";


import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

let guard = false;
const INNER_SUBSCRIBER_ID = "P5JSCanvas_INNER";
const OUTER_SUBSCRIBER_ID = "P5JSCanvas_OUTER";
function P5JSCanvas() {

    const [projectReady, setProjectReady] = React.useState(false);
    const [assetsReady, setAssetsReady] = React.useState(false);
    const ready = projectReady && assetsReady;
    const [assets, setAssets] = useState([]);


    useUnit((unit: any) => {
        //console.log(unit)
        const { sender, payload } = unit;
        const { INIT, channel, request, payload: messagePayload, subscriber_id } = payload;
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
                    resource_id: "http://localhost:8000/AssetServer",
                },
                payload: {
                    request: "subscribe",
                    payload: undefined,
                },
            }]});
            return;
        }
        if (sender.instance_id === "ASSET_SERVER" && request === "subscribeConfirmation") {
            setAssets(messagePayload);
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
        if (request === 'assetEvent') {
            const newAssets = messagePayload.filter(asset => {
                return !assets.some(existingAsset => existingAsset.asset_id === asset.asset_id);
            });
            setAssets(prev => [...prev, ...newAssets]);
            return;
        }

    })



    // useChannel("INIT", (unit: any) => {
    //     if (guard) return;
    //     guard = true;
    //     messageChannel("ProjectState", "subscribe", undefined, OUTER_SUBSCRIBER_ID);
    //     messageChannel("ProjectState", "subscribe", undefined, INNER_SUBSCRIBER_ID)
    //     controller.current.connectToHost(() => {
    //         setReady(true);
    //     });
    // })

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

    // useChannel("ProjectState", (unit: any) => {
    //     const { payload } = unit;
    //     const { channel, request, payload: messagePayload, subscriber_id } = payload;
    //     if (request === "projectNodeEvent") {
    //         if (subscriber_id === INNER_SUBSCRIBER_ID) {
    //             cbRef.current(payload);
    //         }
    //         if (subscriber_id == OUTER_SUBSCRIBER_ID) {
    //             controller.current.receive(messagePayload);
    //         }
    //     }
    //     return {};
    // })

    if (!ready) {
        return <div>Loading...</div>;
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

            }}>
            <P5
                assets={assets}
                project={projectState}
                projectTools={projectTools}
                sendMessage={(m) => globalThis.CK_ADAPTER.pushWorkload({default:m})}
                attachMessageCallback={attachMessageCallback}

            />
        </div>
    );
}
export default P5JSCanvas;