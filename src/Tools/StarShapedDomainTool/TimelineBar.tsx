import { Button } from "@mtrifonov-design/pinsandcurves-design";
import { TimelineController } from "@mtrifonov-design/pinsandcurves-external";
import React, { useSyncExternalStore } from "react";


function PlayButton({ togglePlaying, playing }: { togglePlaying: () => void, playing?: boolean }) {
    return (
        <Button
            iconName={playing ? "pause" : "play_arrow"}
            bgColor="var(--green2)"
            hoverBgColor="var(--green1)"
            color="var(--gray8)"
            onClick={togglePlaying}
        />
    );

}

function TimelineBar({ timeline }: {timeline:TimelineController.TimelineController}) {

    const project = useSyncExternalStore(
        timeline.onTimelineUpdate.bind(timeline),
        timeline.getProject.bind(timeline)
    );

    
    const togglePlaying = () => {
        const project = timeline.getProject();
        const isPlaying = project.timelineData.playing;
        const currentFrame = project.timelineData.playheadPosition;
        if (isPlaying) {
            timeline.projectTools.updatePlayheadPosition(currentFrame, true);
        } else {
            timeline.projectTools.startPlayback();
        }
    }

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            gap: "20px",
        }}>
            <PlayButton togglePlaying={togglePlaying} playing={timeline.getProject().timelineData.playing} />
            <div style={{
                color: "var(--gray7)",
                width: "100px",
            }}>
                {`${project.timelineData.playheadPosition} / ${project.timelineData.focusRange[1]}`}
            </div>

        </div>
    );
}

export default TimelineBar;