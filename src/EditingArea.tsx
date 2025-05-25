import React, { useEffect, useState } from "react";
import { EditingAreaCanvas, TimelineBar, Toolbar } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { messageChannel, useUnit } from "./hooks";
import { TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import { useRef, useSyncExternalStore } from "react";
import FullscreenLoader from "./FullscreenLoader/FullscreenLoader";
import { AssetProvider } from "./AssetManager/context/AssetProvider";
import TimelineProvider, { useTimeline } from "./TimelineUtils/TimelineProvider";
const Controller = TimelineController.TimelineController;

function EditingAreaWrapper() {
    return (
        <AssetProvider>
            <TimelineProvider>
                <EditingArea />
            </TimelineProvider>
        </AssetProvider>
    )
}

function EditingArea() {

    const timeline = useTimeline();
    if (!timeline) {
        return <FullscreenLoader/>;
    }

    return <EditingAreaContent timeline={timeline} />;
}





function EditingAreaContent({timeline}: {timeline: Controller}) {

    const projectState = useSyncExternalStore(
        timeline.onTimelineUpdate.bind(timeline),
        timeline.getProject.bind(timeline),
    );
    window.timeline = timeline; // for debugging purposes
    //console.log("projectState", projectState.timelineData.playheadPosition);
    const useProjectState = () => projectState;
    const projectTools = timeline.projectTools;
    //console.log("projectTools", projectTools);
    const interpolateSignalValue = timeline.interpolateSignalValueAtTime.bind(timeline);
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
                    project={useProjectState()}
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
export default EditingAreaWrapper;