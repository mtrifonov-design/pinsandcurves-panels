import React, { useEffect, useState } from "react";
import { CanvasCodeEditor, OrganisationAreaSignalListDependencies, ProjectTools } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { useChannel, messageChannel, useUnit } from "./hooks";

type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
import FullscreenLoader from "./FullscreenLoader/FullscreenLoader";
import CONFIG from "./Config";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

let guard = false;
const subscriber_id = "CodeEditor" + generateId();

const defaultSketch = `function setup() {
    createCanvas(400, 400);
}
function draw() {
    background(220);
    ellipse(200,200, 50, 50);
}
`


function addP5SketchToAssets(assets: any[]) {

    // // convert default sketch to data url
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
    return Math.random().toString(36).substr(2, 9);
}
function CodeEditor() {

    const [assetsReady, setAssetsReady] = React.useState(false);
    const [assets, setAssets] = useState([]);
    const [projectReady, setProjectReady] = React.useState(false);
    const ready = projectReady && assetsReady;

     const savedBlockerId = useRef<string | undefined>(undefined);
    const unsubscribeCount = useRef(0);

        useUnit(unit => {
            // //console.log("received", unit)
            const { payload, sender } = unit;
            const { channel, request, payload: messagePayload, INIT, TERMINATE, blocker_id } = payload;
    
            if (INIT) {
                messageChannel("ProjectState", "subscribe", undefined, subscriber_id);
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
            }
            if (TERMINATE) {
                messageChannel("ProjectState", "unsubscribe", undefined, subscriber_id);
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
    
            if (channel === "ProjectState") {
                if (request === "projectNodeEvent") {
                    controller.current.receive(messagePayload);
                }
    
                if (request === "unsubscribeConfirmation") {
                    unsubscribeCount.current++;
                }
            }

            if (sender.instance_id === "ASSET_SERVER" && request === "subscribeConfirmation") {
                const processedMessagePayload = addP5SketchToAssets(messagePayload);
                setAssets(processedMessagePayload);
                setAssetsReady(true);
                return;
            }

            if (sender.instance_id === "ASSET_SERVER" && request === "unsubscribeConfirmation") {
                unsubscribeCount.current++;
            }

            if (unsubscribeCount.current === 1) { 
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


    // useChannel("INIT", (unit: any) => {
    //     if (guard) return;
    //     guard = true;
    //     messageChannel("ProjectState", "subscribe", undefined, subscriber_id);
    //     controller.current.connectToHost(() => {
    //         setReady(true);
    //     });
    // })

    const controller = useRef(
        Controller.Client(
            (e : any) => {
                messageChannel("ProjectState", "projectNodeEvent", e,subscriber_id);
            }
        )
    );

    // useChannel("ProjectState", (unit: any) => {
    //     const { payload } = unit;
    //     const { channel, request, payload: messagePayload } = payload;
    //     if (request === "projectNodeEvent") {
    //         controller.current.receive(messagePayload);
    //     }
    //     return {};
    // })

    if (!ready) {
        return <FullscreenLoader />;
    }

    return <CodeEditorContent controller={controller} assets={assets}  />;


}


function CodeEditorContent({controller, assets}: {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController, assets: any[]}) {

    const projectState = useSyncExternalStore(controller.current.subscribeToProjectUpdates.bind(controller.current), controller.current.getProject.bind(controller.current));
    const useProjectState = () => projectState;
    const projectTools = controller.current.projectTools as ProjectTools;

    // const functionString = projectState.signalData["HIDDEN_CODE"].defaultValue;

    // const setFunctionString = (newFunctionString: string) => {
    //     projectTools.updateSignalDefaultValue("HIDDEN_CODE", newFunctionString);
    // };

    const codeDataUrl = assets.find((asset: any) => asset.asset_id === "P5JSSKETCH").dataUrl;

    const setFunctionString = (newFunctionString: string) => {
        const assets = [
            {
                asset_id: "P5JSSKETCH",
                asset_name: "P5JS Sketch",
                asset_type: "application/javascript",
                dataUrl: newFunctionString
            }
        ]
        globalThis.CK_ADAPTER.pushWorkload({
            default: [{
                type: "worker",
                receiver: {
                    instance_id: "ASSET_SERVER",
                    modality: "wasmjs",
                    resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServer`,
                },
                payload: {
                    request: "pushAssets",
                    payload: assets,
                },
            }]
        })
    }


    return (
        <div
        style={{
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
        }}>
        <CanvasCodeEditor 
            setFunctionString={setFunctionString}
            functionString={codeDataUrl}
        />
        </div>
    );
    }   
export default CodeEditor;