import React, { useSyncExternalStore } from "react";
import CONFIG from "../Config";
import { OrganisationAreaSignalList } from "@mtrifonov-design/pinsandcurves-specialuicomponents";


function P5CanvasContent(p: {
    asset: any;
}) {
    const { asset } = p;
    const project = useSyncExternalStore(asset.data.onPushUpdate.bind(asset.data), asset.data.getProject.bind(asset.data));
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
            height: '100%',
            overflow: 'hidden',
        }}>
            <OrganisationAreaSignalList 
                project = {project}
                projectTools = {asset.data.projectTools}
                openCreateSignalModal={() => {
                    asset.data.projectTools.createContinuousSignal(crypto.randomUUID(), "Signal "+generateSignalSuffix(), [0,1], 0, "return easyLinear();");
                }}
            />
        </div>
    );
}

export default P5CanvasContent;