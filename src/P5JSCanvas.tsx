import React, { useEffect, useState } from "react";
import { OrganisationAreaSignalList, OrganisationAreaSignalListDependencies, P5JSCanvas as P5 } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { useMessageChannel, messageChannel } from "./hooks";


type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

function P5JSCanvas() {
    useEffect(() => {
        messageChannel("ProjectState", "subscribe");
    }, []);

    const message = useMessageChannel("ProjectState");

    if (!message) {
        return <div>Loading...</div>;
    }

    return <P5JSCanvasContent />;
}

function P5JSCanvasContent() {

    const controller = useRef(
        Controller.Client(
            (e: any) => {
                messageChannel("ProjectState", "projectNodeEvent", e);
            }
        )
    );

    const [connected, setConnected] = useState(false);

    useEffect(() => {
        controller.current.connectToHost(() => {
            setConnected(true);
        });
    }, []);

    const message = useMessageChannel("ProjectState");
    useEffect(() => {
        if (message && message.request === "projectNodeEvent") {
            controller.current.receive(message.payload);
        }
    })

    if (!connected) {
        return <div>Loading...</div>;
    }

    return <P5JSCanvasContent2 controller={controller} />;
}
function P5JSCanvasContent2({ controller }: { controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController }) {

    const projectState = useSyncExternalStore(controller.current.subscribeToProjectUpdates.bind(controller.current), controller.current.getProject.bind(controller.current));
    const useProjectState = () => projectState;
    const projectTools = controller.current.projectTools;
    const cbRef = useRef(() => { });
    const cb = cbRef.current;
    const setCb = (callback: () => void) => {
        cbRef.current = callback;
    }

    const message = useMessageChannel("ProjectState");
    if (message) {
        if (message.request === "projectNodeEvent") {
            cb(message.payload);
        }
    }
    const attachMessageCallback = (callback: () => void) => {
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
                sendMessage={(m) => messageChannel("ProjectState", "projectNodeEvent", m)}
                attachMessageCallback={attachMessageCallback}

            />
        </div>
    );
}
export default P5JSCanvas;