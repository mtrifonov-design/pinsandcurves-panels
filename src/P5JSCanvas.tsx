import React, { useEffect, useState } from "react";
import { OrganisationAreaSignalList, OrganisationAreaSignalListDependencies, P5JSCanvas as P5 } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { useChannel, messageChannel } from "./hooks";


type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

let guard = false;
const INNER_SUBSCRIBER_ID = "P5JSCanvas_INNER";
const OUTER_SUBSCRIBER_ID = "P5JSCanvas_OUTER";
function P5JSCanvas() {

    const [ready, setReady] = React.useState(false);

    useChannel("INIT", (unit: any) => {
        if (guard) return;
        guard = true;
        messageChannel("ProjectState", "subscribe", undefined, OUTER_SUBSCRIBER_ID);
        messageChannel("ProjectState", "subscribe", undefined, INNER_SUBSCRIBER_ID)
        controller.current.connectToHost(() => {
            setReady(true);
        });
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

    useChannel("ProjectState", (unit: any) => {
        const { payload } = unit;
        const { channel, request, payload: messagePayload, subscriber_id } = payload;
        if (request === "projectNodeEvent") {
            if (subscriber_id === INNER_SUBSCRIBER_ID) {
                cbRef.current(messagePayload);
            }
            if (subscriber_id == OUTER_SUBSCRIBER_ID) {
                controller.current.receive(messagePayload);
            }
        }
        return {};
    })

    if (!ready) {
        return <div>Loading...</div>;
    }

    return <P5JSCanvasContent controller={controller} setCb={setCb} />;


}




function P5JSCanvasContent({ controller, setCb }: { controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController }) {

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
                project={projectState}
                projectTools={projectTools}
                sendMessage={(m) => messageChannel("ProjectState", "projectNodeEvent", m, INNER_SUBSCRIBER_ID)}
                attachMessageCallback={attachMessageCallback}

            />
        </div>
    );
}
export default P5JSCanvas;