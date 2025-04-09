import React, { useEffect } from "react";
import { CanvasCodeEditor, OrganisationAreaSignalListDependencies, ProjectTools } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { useChannel, messageChannel } from "./hooks";

type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

let guard = false;
function CodeEditor() {

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

    return <CodeEditorContent controller={controller} />;


}


function CodeEditorContent({controller}: {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController}) {

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