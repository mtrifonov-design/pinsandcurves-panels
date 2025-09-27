import { Button } from "@mtrifonov-design/pinsandcurves-design";
import { TimelineController } from "@mtrifonov-design/pinsandcurves-external";
import React, { useRef, useSyncExternalStore } from "react";
import {Timeline} from "../../LibrariesAndUtils/Timeline";


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

    const timelineProjectRef = useRef(new Timeline(timeline));
    const timelineProject = timelineProjectRef.current;
    timelineProject.update(timeline);

    
    const togglePlaying = () => {
        const project = timelineProject.data;
        const isPlaying = project.general.playing;
        const currentFrame = timelineProject.playheadPosition;
        if (isPlaying) {
            timelineProject.projectTools.updatePlayheadPosition(currentFrame, true);
        } else {
            timelineProject.projectTools.startPlayback();
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
            <PlayButton togglePlaying={togglePlaying} playing={timelineProject.data.general.playing} />
            <div style={{
                color: "var(--gray7)",
                width: "100px",
            }}>
                {`${timelineProject.playheadPosition} / ${timelineProject.data.general.focusRange[1]}`}
            </div>

        </div>
    );
}

export default TimelineBar;