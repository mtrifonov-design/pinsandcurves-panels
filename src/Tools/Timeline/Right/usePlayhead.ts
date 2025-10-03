import { useEffect, useRef, useState } from "react";
import { State } from "./reduceStateToSceneObjects";
import useRaf from "./useRaf";
import { produce } from "immer";

const computeActualPlayhead = (state: State) => {
    const playheadPos = state.timeline.data.general.playheadPosition;
    const focusRange = state.timeline.data.general.focusRange;
    const range = focusRange[1] - focusRange[0];
    const frameRate = state.timeline.data.general.frameRate;
    const elapsedTime = Date.now() - state.timeline.data.general.playingTimestamp;
    const framesElapsed = Math.floor((elapsedTime / 1000) * frameRate);
    return (focusRange[0] + ((playheadPos + framesElapsed - focusRange[0]) % range));
};

function usePlayhead(state: State, updateState: (newState: State) => void) {
    const [toggle, setToggle] = useState(false);
    const toggleRef = useRef(toggle);
    //console.log(toggle,toggleRef.current)
    //console.log(state.timeline.data.general.playing)

    // const rafState = useRef(state);
    // rafState.current = state;
    useRaf(() => {
        // const state = rafState.current;
        // console.log("usePlayheadRaf", state.local.data.timelineUI.playheadPosition, state.timeline.data.general.playheadPosition, playing);
        const changed = toggle !== toggleRef.current;
        if (changed) {
            const nextState = produce(state, (draft) => {
                draft.timeline.data.general.playing = !draft.timeline.data.general.playing;
                draft.timeline.data.general.playingTimestamp = Date.now();
                draft.timeline.data.general.playheadPosition = draft.local.data.timelineUI.playheadPosition; // to trigger update
            });
            updateState(nextState);
        } else {
            const playing = state.timeline.data.general.playing;
            if (playing) {
                const newPlayhead = computeActualPlayhead(state);
                if (newPlayhead !== state.local.data.timelineUI.playheadPosition) {
                    const nextState = produce(state, (draft) => {
                        draft.local.data.timelineUI.playheadPosition = newPlayhead;
                    });
                    updateState(nextState);
                }
            }
        }
        toggleRef.current = toggle;
        
    }, true);

    useEffect(() => {
        const handleSpaceBar = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                setToggle(!toggle);
                // const nextState = produce(state, (draft) => {
                //     draft.timeline.data.general.playing = !draft.timeline.data.general.playing;
                //     draft.timeline.data.general.playingTimestamp = Date.now();
                // });
                // updateState(nextState);
            }
        }
        window.addEventListener("keydown", handleSpaceBar);
        return () => {
            window.removeEventListener("keydown", handleSpaceBar);
        }
    }, [toggle])


}
export default usePlayhead;