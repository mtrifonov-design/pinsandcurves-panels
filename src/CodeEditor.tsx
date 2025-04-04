import React, { useEffect } from "react";
import { CanvasCodeEditor, OrganisationAreaSignalListDependencies, ProjectTools } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { useMessageChannel, messageChannel } from "./hooks";

type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

function CodeEditor() {
    useEffect(() => {
        messageChannel("ProjectState", "subscribe");
    }, []);

    const message = useMessageChannel("ProjectState");

    if (!message) {
        return <div>Loading...</div>;
    }

    return <CodeEditorContent />;
}

function CodeEditorContent() {

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

    return <CodeEditorContent2 controller={controller} />;
}
function CodeEditorContent2({controller}: {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController}) {

    const projectState = useSyncExternalStore(controller.current.subscribeToProjectUpdates.bind(controller.current), controller.current.getProject.bind(controller.current));
    const useProjectState = () => projectState;
    const projectTools = controller.current.projectTools as ProjectTools;

    const functionString = projectState.signalData["HIDDEN_CODE"].defaultValue;

    const setFunctionString = (newFunctionString: string) => {
        projectTools.updateSignalDefaultValue("HIDDEN_CODE", newFunctionString);
    };

    return (
        <div
        style={{
            width: '100vw',
            height: '100vh',
        
        }}>
        <CanvasCodeEditor 
            setFunctionString={setFunctionString}
            functionString={functionString}
        />
        </div>
    );
    }   
export default CodeEditor;