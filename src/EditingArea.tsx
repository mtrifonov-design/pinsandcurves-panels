import React, { useEffect, useState } from "react";
import { EditingAreaCanvas, OrganisationAreaSignalList, OrganisationAreaSignalListDependencies, TimelineBar, Toolbar } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { messageChannel, useChannel } from "./hooks";

type OrganisationAreaSignalListProps = OrganisationAreaSignalListDependencies

import { ProjectDataStructure, PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
const Controller = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

let guard = false;
const subscriber_id = "EditingArea";
function EditingArea() {

    const [ready, setReady] = React.useState(false);


    useChannel("INIT", (unit: any) => {
        if (guard) return;
        guard = true;
        messageChannel("ProjectState", "subscribe", undefined, subscriber_id);
        controller.current.connectToHost(() => {
            setReady(true);
        });
    })
    


    const controller = useRef(
        Controller.Client(
            (e : any) => {
                messageChannel("ProjectState", "projectNodeEvent", e, subscriber_id);
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

    return <EditingAreaContent controller={controller.current} />;


}





function EditingAreaContent({controller}: {controller: PinsAndCurvesProjectController.PinsAndCurvesProjectController}) {

    const projectState = useSyncExternalStore(controller.subscribeToProjectUpdates.bind(controller), controller.getProject.bind(controller));
    const useProjectState = () => projectState;
    const projectTools = controller.projectTools;
    const interpolateSignalValue = controller.interpolateSignalValueAtTime.bind(controller);
    const [activeTool, setActiveTool] = useState("pointer");

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
            backgroundColor: "#2C333A"
        
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