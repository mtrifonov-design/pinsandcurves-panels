import React, { useEffect } from "react";
import { OrganisationAreaSignalList, OrganisationAreaSignalListDependencies } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { useMessageChannel, messageChannel, useChannel } from "./hooks";

type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

// function SignalList() {
//     useEffect(() => {
//         messageChannel("ProjectState", "subscribe");
//     }, []);

//     const message = useMessageChannel("ProjectState");

//     if (!message) {
//         return <div>Loading...</div>;
//     }

//     return <SignalListContent />;
// }

// function SignalListContent() {

//     const controller = useRef(
//         Controller.Client(
//             (e : any) => {
//                 messageChannel("ProjectState", "projectNodeEvent", e);
//             }
//         )
//     );

//     useEffect(() => {
//         controller.current.connectToHost();
//     }, []);

//     const message = useMessageChannel("ProjectState");
//     if (!message) {
//         return <div>Loading...</div>;
//     }
//     if (message.request === "projectNodeEvent") {
//         controller.current.receive(message.payload);
//     }

//     return <SignalListContent2 controller={controller} />;
// }
function SignalListContent({controller}: {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController}) {

    const projectState = useSyncExternalStore(controller.current.subscribeToProjectUpdates.bind(controller.current), controller.current.getProject.bind(controller.current));
    const useProjectState = () => projectState;
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

function SignalList() {

    const [ready, setReady] = React.useState(false);

    
    useEffect(() => {
        if (guard) return;
        console.log("running subscribe effect", guard);
        guard = true;
        messageChannel("ProjectState", "subscribe");
        controller.current.connectToHost(() => {
            setReady(true);
        });
    }, []);

    const controller = useRef(
        Controller.Client(
            (e : any) => {
                messageChannel("ProjectState", "projectNodeEvent", e);
            }
        )
    );

    useChannel("ProjectState", (unit: any) => {
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