import React, { useEffect, useState } from "react";
import { EditingAreaCanvas, OrganisationAreaSignalList, OrganisationAreaSignalListDependencies, TimelineBar, Toolbar } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { messageChannel, useUnit } from "./hooks";

type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
import FullscreenLoader from "./FullscreenLoader/FullscreenLoader";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;


function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
const subscriber_id = "EditingArea"+generateId();
function EditingArea() {

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
                //console.log("EDITING",e.lastAgreedProjectStateId, e.newProjectStateId);
                // console.log("EDITING",e.newProjectStateId);
                messageChannel("ProjectState", "projectNodeEvent", e, subscriber_id);
            }
        )
    );

    if (!ready) {
        return <FullscreenLoader/>;
    }

    return <EditingAreaContent controller={controller.current} />;


}





function EditingAreaContent({controller}: {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController}) {

    const projectState = useSyncExternalStore(controller.subscribeToProjectUpdates.bind(controller), controller.getProject.bind(controller));
    const useProjectState = () => projectState;
    const projectTools = controller.projectTools;
    const interpolateSignalValue = controller.interpolateSignalValueAtTime.bind(controller);
    const [activeTool, setActiveTool] = useState("pointer");
    useEffect(() => {
        // togggle active tool on keypress "a"
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === "a") {
                setActiveTool((prevTool) => (prevTool === "pointer" ? "add_pin" : "pointer"));
            }
        };
        window.addEventListener("keypress", handleKeyPress);
        return () => {
            window.removeEventListener("keypress", handleKeyPress);
        };
    }, []);

    return (
        <div
        style={{
            width: '100vw',
            height: '100vh',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '50px 1fr',
            gridTemplateAreas: `
                "bar bar"
                "editing editing"
            `,
            backgroundColor: "#2C333A",
            overflow: "hidden",
        
        }}>
            <div style={{gridArea: "bar",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: "20px",
            }}>
                <TimelineBar
                                project={useProjectState()}
                                projectTools={projectTools}
                />
                <Toolbar
                    setActiveTool={setActiveTool}
                    activeTool={activeTool}
                />
            </div>
            <div style={{
                gridArea: "editing",
                height: "calc(100vh - 50px)",
            }}>
                <EditingAreaCanvas
                    activeTool={activeTool}
                    useProjectState={useProjectState}
                    projectTools={projectTools}
                    setActiveEditor={() => {}}
                    interpolateSignalValue={
                        interpolateSignalValue
                    }
                />
            </div>

        </div>
    );
    }   
export default EditingArea;