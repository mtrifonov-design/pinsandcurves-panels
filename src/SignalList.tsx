import React, { useEffect } from "react";
import { OrganisationAreaSignalList, OrganisationAreaSignalListDependencies } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { messageChannel, useChannel } from "./hooks";

type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

function SignalListContent({controller}: {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController}) {

    const projectState = useSyncExternalStore(controller.current.subscribeToProjectUpdates.bind(controller.current), controller.current.getProject.bind(controller.current));
    const projectTools = controller.current.projectTools;


    return (
        <div
        style={{
            width: '100vw',
            height: '100vh',
        
        }}>
        <OrganisationAreaSignalList 
        project = {projectState}
        projectTools = {projectTools}
        openCreateSignalModal={() => {}}
        />
        </div>
    );
    }   


let guard = false;
let subscriberId = "SignalList"
function SignalList() {

    const [ready, setReady] = React.useState(false);

    useChannel("INIT", (unit: any) => {
        if (guard) return;
        guard = true;
        messageChannel("ProjectState", "subscribe", undefined, subscriberId);
        controller.current.connectToHost(() => {
            setReady(true);
        });
    })

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

    return <SignalListContent controller={controller} />;


}
export default SignalList;