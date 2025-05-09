import React, { useSyncExternalStore } from "react";
import CONFIG from "../Config";
import { OrganisationAreaSignalList } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { TimelineController } from "@mtrifonov-design/pinsandcurves-external";


function P5CanvasContent(p: {
    timeline: TimelineController.TimelineController;
}) {
    const { timeline } = p;
    const project = useSyncExternalStore(
        timeline.onTimelineUpdate.bind(timeline),
        timeline.getProject.bind(timeline),
    );
    const generateSignalSuffix = () => {
        const signalNames = Object.values(project.orgData.signalNames);
        let suffix = 1;
        while (signalNames.some(signalName => signalName === "Signal " + suffix)) {
            suffix++;
        }
        return suffix;
    }
    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
        }}>
            <OrganisationAreaSignalList 
                project = {project}
                projectTools = {timeline.projectTools}
                openCreateSignalModal={() => {
                    timeline.projectTools.createContinuousSignal(crypto.randomUUID(), "Signal "+generateSignalSuffix(), [0,1], 0, "return easyLinear();");
                }}
            />
        </div>
    );
}

export default P5CanvasContent;