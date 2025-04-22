import React, { useEffect } from "react";
import { CanvasCodeEditor, OrganisationAreaSignalListDependencies, ProjectTools } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { useChannel, messageChannel, useUnit } from "./hooks";

type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

let guard = false;
const subscriber_id = "CodeEditor";

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
function CodeEditor() {

    const [ready, setReady] = React.useState(false);

    
    // useUnit(unit => {
    //     const { payload } = unit;
    //     const { channel, request, payload: messagePayload, INIT, TERMINATE } = payload;

    //     if (INIT) {
    //         messageChannel("ProjectState", "subscribe", undefined, subscriber_id);
    //         controller.current.connectToHost(() => {
    //             setReady(true);
    //         });
    //     }
    //     if (TERMINATE) {
    //         messageChannel("ProjectState", "unsubscribe", undefined, subscriber_id);
    //     }


    //     if (channel === "ProjectState") {
    //         if (request === "projectNodeEvent") {
    //             controller.current.receive(messagePayload);
    //         }
    //     }
    //     return {};
    // })

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


    // useChannel("INIT", (unit: any) => {
    //     if (guard) return;
    //     guard = true;
    //     messageChannel("ProjectState", "subscribe", undefined, subscriber_id);
    //     controller.current.connectToHost(() => {
    //         setReady(true);
    //     });
    // })

    const controller = useRef(
        Controller.Client(
            (e : any) => {
                messageChannel("ProjectState", "projectNodeEvent", e,subscriber_id);
            }
        )
    );

    // useChannel("ProjectState", (unit: any) => {
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
            overflow: 'hidden',
        }}>
        <CanvasCodeEditor 
            setFunctionString={setFunctionString}
            functionString={functionString}
        />
        </div>
    );
    }   
export default CodeEditor;