import React, { useEffect, useLayoutEffect, useState } from "react";
import { CreateSignalModal, OrganisationAreaSignalList, OrganisationAreaSignalListDependencies } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { messageChannel, useChannel } from "./hooks";
import CopilotInterior from "./Copilot/Copilot";


type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

function CopilotContent(p: 
    {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController,
    persistentState: any,
    setPersistentState: (state: any) => void,
    }) {
        const { controller, persistentState, setPersistentState } = p;
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
        openCreateSignalModal={() => {setMode("newsignaldialogue")}}
        persistentState={persistentState}
        setPersistentState={setPersistentState}
        />
        </div>
    );
    }   


let guard = false;
let subscriberId = "SignalList"
function Copilot() {

    const [projectReady, setProjectReady] = React.useState(false);
    const [persistentDataReady, setPersistentDataReady] = React.useState(false);
    const ready = projectReady && persistentDataReady;

    useChannel("PERSISTENT_DATA", (unit: any) => {
        const { payload } = unit;
        const { channel, request, payload: messagePayload } = payload;
        if (request === "responseData") {
            setPersistentDataReady(true);
            setPersistentState(messagePayload);
        }
        return {};
    })

    useChannel("INIT", (unit: any) => {
        if (guard) return;
        guard = true;
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
    })

    const [persistentState, setPersistentState] = useState({});


    const controller = useRef(
        Controller.Client(
            (e : any) => {
                messageChannel("ProjectState", "projectNodeEvent", e, subscriberId);
            }
        )
    );

    useChannel("ProjectState", (unit: any) => {
        //console.log("SignalList channel", unit);
        const { payload } = unit;
        const { channel, request, payload: messagePayload } = payload;
        if (request === "projectNodeEvent") {
            controller.current.receive(messagePayload);
        }
        return {};
    })

    if (!ready) {
        return <div>Loading...</div>;
    }

    return <CopilotContent controller={controller}
        persistentState={persistentState}
        setPersistentState={(state) => {
            setPersistentState(state);
            
        }}
    />;


}
export default Copilot;