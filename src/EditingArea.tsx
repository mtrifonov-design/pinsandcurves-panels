import React, { useEffect } from "react";
import { EditingAreaCanvas, OrganisationAreaSignalList, OrganisationAreaSignalListDependencies } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { useMessageChannel, messageChannel } from "./hooks";

type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

function EditingArea() {
    useEffect(() => {
        messageChannel("ProjectState", "subscribe");
    }, []);

    const message = useMessageChannel("ProjectState");

    if (!message) {
        return <div>Loading...</div>;
    }

    return <EditingAreaContent />;
}

function EditingAreaContent() {

    const controller = useRef(
        Controller.Client(
            (e : any) => {
                messageChannel("ProjectState", "projectNodeEvent", e);
            }
        )
    );

    useEffect(() => {
        controller.current.connectToHost();
    }, []);

    const message = useMessageChannel("ProjectState");
    if (!message) {
        return <div>Loading...</div>;
    }
    if (message.request === "projectNodeEvent") {
        controller.current.receive(message.payload);
    }

    return <EditingAreaContent2 controller={controller.current} />;
}
function EditingAreaContent2({controller}: {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController}) {

    const projectState = useSyncExternalStore(controller.subscribeToProjectUpdates.bind(controller), controller.getProject.bind(controller));
    const useProjectState = () => projectState;
    const projectTools = controller.projectTools;
    const interpolateSignalValue = controller.interpolateSignalValueAtTime.bind(controller);


    return (
        <div
        style={{
            width: '100vw',
            height: '100vh',
        
        }}>
            <EditingAreaCanvas
                activeTool={"pointer"}
                useProjectState={useProjectState}
                projectTools={projectTools}
                setActiveEditor={() => {}}
                interpolateSignalValue={
                    interpolateSignalValue
                }
            />
        </div>
    );
    }   
export default EditingArea;