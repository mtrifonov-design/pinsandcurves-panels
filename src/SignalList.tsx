import React, { useEffect, useState } from "react";
import { CreateSignalModal, OrganisationAreaSignalList, OrganisationAreaSignalListDependencies } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { messageChannel, useUnit } from "./hooks";

type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

function SignalListContent({controller}: {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController}) {

    const projectState = useSyncExternalStore(controller.current.subscribeToProjectUpdates.bind(controller.current), controller.current.getProject.bind(controller.current));
    const projectTools = controller.current.projectTools;

    const [mode, setMode] = useState("signalList");


    if (mode === "signalList") {
    return (
        <div
        style={{
            width: '100vw',
            height: '100vh',
        
        }}>
        <OrganisationAreaSignalList 
        project = {projectState}
        projectTools = {projectTools}
        openCreateSignalModal={() => {setMode("newsignaldialogue")}}
        />
        </div>
    );
    } else if (mode === "newsignaldialogue") {
        return (
            <div
            style={{
                width: '100vw',
                height: '100vh',
            
            }}>
                <CreateSignalModal 
                        useProject = {() => projectState}
                        useProjectTools = {() => projectTools}
                        closeModal={() => {setMode("signalList")}}
                        
                />
            </div>
        );
    }
    }   


let guard = false;
let subscriber_id = "SignalList"

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
function SignalList() {

    const [ready, setReady] = React.useState(false);

    const savedBlockerId = useRef<string | undefined>(undefined);
    useUnit(unit => {
        const { payload } = unit;
        const { channel, request, payload: messagePayload, INIT, TERMINATE, blocker_id } = payload;

        if (INIT) {
            messageChannel("ProjectState", "subscribe", undefined, subscriber_id);
            controller.current.connectToHost(() => {
                setReady(true);
            });
        }
        if (TERMINATE) {
            messageChannel("ProjectState", "unsubscribe", undefined, subscriber_id);
            savedBlockerId.current = blocker_id;
        }

        if (channel === "ProjectState") {
            if (request === "projectNodeEvent") {
                controller.current.receive(messagePayload);
            }

            if (request === "unsubscribeConfirmation") {
                globalThis.CK_ADAPTER.pushWorkload({
                    default: [{
                        type: "blocker",
                        blocker_id: savedBlockerId.current,
                        id: generateId(),
                        blocker_count: 2,
                    }]
                })
            }
        }
        return {};
    })

    const controller = useRef(
        Controller.Client(
            (e : any) => {
                messageChannel("ProjectState", "projectNodeEvent", e, subscriber_id);
            }
        )
    );

    if (!ready) {
        return <div>Loading...</div>;
    }

    return <SignalListContent controller={controller} />;


}
export default SignalList;