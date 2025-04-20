import React, { useEffect, useLayoutEffect, useState } from "react";
import { CreateSignalModal, OrganisationAreaSignalList, OrganisationAreaSignalListDependencies } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { messageChannel, useChannel, useUnit } from "./hooks";
import CopilotInterior from "./Copilot/Copilot";


type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

function CopilotContent(p: 
    {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController,
    persistentState: any,
    assets: any[],
    setPersistentState: (state: any) => void,
    }) {
        const { controller, persistentState, setPersistentState,assets } = p;
    const projectState = useSyncExternalStore(controller.current.subscribeToProjectUpdates.bind(controller.current), controller.current.getProject.bind(controller.current));
    const projectTools = controller.current.projectTools;

    return (
        <div
        style={{
            width: '100vw',
            height: '100vh',
        
        }}>
        <CopilotInterior 
        project = {projectState}
        projectTools = {projectTools}
        persistentState={persistentState}
        setPersistentState={setPersistentState}
        assets={assets}
        />
        </div>
    );
    }   


// let guard = false;
let subscriberId = "Copilot"
function Copilot() {

    const [projectReady, setProjectReady] = React.useState(false);
    const [persistentDataReady, setPersistentDataReady] = React.useState(false);
    const [assets, setAssets] = React.useState<any[]>([]);
    const [assetsReady, setAssetsReady] = React.useState(false);
    const ready = projectReady && persistentDataReady && assetsReady;

    useUnit(unit => {
        const { payload, sender, receiver } = unit;
        const { channel, request, payload: messagePayload, INIT } = payload;

        if (INIT) {
            messageChannel("ProjectState", "subscribe", undefined, subscriberId);
            controller.current.connectToHost(() => {
                setProjectReady(true);
            });
            globalThis.CK_ADAPTER.pushWorkload({
                default: [
                  {
                    type: "worker",
                    receiver: {
                      instance_id: "COPILOT_EVAL",
                      modality: "wasmjs",
                      resource_id: "http://localhost:8000/CopilotEval",
                    },
                    payload: {
                        INIT: true,
                    },
                  },
                ]
              });
              globalThis.CK_ADAPTER.pushWorkload({
                default: [
                  {
                    type: "worker",
                    receiver: {
                      instance_id: "ASSET_SERVER",
                      modality: "wasmjs",
                      resource_id: "http://localhost:8000/AssetServer",
                    },
                    payload: {
                        request: "subscribe",
                    },
                  },
                ]
              });
              globalThis.CK_ADAPTER.pushWorkload({
                default: [
                  {
                    type: "worker",
                    receiver: {
                      instance_id: "COPILOT_DATA",
                      modality: "wasmjs",
                      resource_id: "http://localhost:8000/CopilotData",
                    },
                    payload: {
                        channel: "PERSISTENT_DATA", 
                        request: "requestData"
                    },
                  },
                ]
              });

        }

        if (channel === "PERSISTENT_DATA") {
            console.log("Persistent data channel", unit);
            if (request === "responseData") {
                setPersistentDataReady(true);
                setPersistentState(messagePayload);
            }
        }

        if (channel === "ProjectState") {
            if (request === "projectNodeEvent") {
                controller.current.receive(messagePayload);
            }
        }

        if (sender.instance_id === "ASSET_SERVER" && request === "subscribeConfirmation") {
            setAssets(messagePayload);
            setAssetsReady(true);
            return;
        }

        if (request === "assetEvent") {
            const newAssets = messagePayload.filter(asset => {
                return !assets.some(existingAsset => existingAsset.asset_id === asset.asset_id);
            });
            setAssets(prev => [...prev, ...newAssets]);
            return;
        }


    })


    // useChannel("PERSISTENT_DATA", (unit: any) => {
    //     const { payload } = unit;
    //     const { channel, request, payload: messagePayload } = payload;
    //     if (request === "responseData") {
    //         setPersistentDataReady(true);
    //         setPersistentState(messagePayload);
    //     }
    //     return {};
    // })

    // useChannel("INIT", (unit: any) => {
    //     if (guard) return;
    //     guard = true;
    //     messageChannel("ProjectState", "subscribe", undefined, subscriberId);
    //     controller.current.connectToHost(() => {
    //         setProjectReady(true);
    //     });
    //     globalThis.CK_ADAPTER.pushWorkload({
    //         default: [
    //           {
    //             type: "worker",
    //             receiver: {
    //               instance_id: "COPILOT_EVAL",
    //               modality: "wasmjs",
    //               resource_id: "http://localhost:8000/CopilotEval",
    //             },
    //             payload: {
    //                 INIT: true,
    //             },
    //           },
    //         ]
    //       });
    //       globalThis.CK_ADAPTER.pushWorkload({
    //         default: [
    //           {
    //             type: "worker",
    //             receiver: {
    //               instance_id: "COPILOT_DATA",
    //               modality: "wasmjs",
    //               resource_id: "http://localhost:8000/CopilotData",
    //             },
    //             payload: {
    //                 channel: "PERSISTENT_DATA", 
    //                 request: "requestData"
    //             },
    //           },
    //         ]
    //       });
    // })

    const [persistentState, setPersistentState] = useState({});


    const controller = useRef(
        Controller.Client(
            (e : any) => {
                messageChannel("ProjectState", "projectNodeEvent", e, subscriberId);
            }
        )
    );

    // useChannel("ProjectState", (unit: any) => {
    //     //console.log("SignalList channel", unit);
    //     const { payload } = unit;
    //     const { channel, request, payload: messagePayload } = payload;
    //     if (request === "projectNodeEvent") {
    //         controller.current.receive(messagePayload);
    //     }
    //     return {};
    // })

    if (!ready) {
        return <div>Loading...</div>;
    }

    return <CopilotContent controller={controller}
        persistentState={persistentState}
        assets={assets}
        setPersistentState={(state) => {
            setPersistentState(state);
            
        }}
    />;


}
export default Copilot;