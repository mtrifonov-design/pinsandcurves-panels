import { Icon, NumberInput } from "@mtrifonov-design/pinsandcurves-design";
import { trackHeight } from "../Right/constants";
import { useState } from "react";
import interpolateSignalValue from "../../../LibrariesAndUtils/InterpolateSignalValue";
import { produce } from "immer";
import styles from "./styles.module.css";

function Rhombus({ signal, state, updateState, value, setValue } : { state: any, updateState: (entry: any) => void, setValue: (value: number) => void }) {
    const playheadPosition = state.timeline.data.general.playheadPosition;
    const keyframes = state.timeline.data.signalKeyframes[signal].map((kfId: string) => state.timeline.data.keyframeData[kfId]);
    const existingKeyframe = keyframes.find((kf: any) => kf.frame === playheadPosition);
    const isActive = existingKeyframe !== undefined;
    const onClick = () => {
        setValue(value);
    }
    return <Icon iconName="stat_0" color={isActive ? "red" : "gray"} onClick={onClick} />
}

function Value({ signal, state, value, updateState, setValue }: { signal: any, state: any, value: number, updateState: (entry: any) => void, setValue: (value: number) => void }) {
    return <div>
        <NumberInput
            initialValue={value}
            onChange={(newValue) => setValue(newValue)}
            step={0.01}
        />
    </div>
}

function Signal({ signal, state, updateState }: { signal: any, updateState: (entry: any) => void }) {

    const playheadPosition = state.timeline.data.general.playheadPosition;
    const keyframes = state.timeline.data.signalKeyframes[signal].map((kfId: string) => state.timeline.data.keyframeData[kfId]);
    const value = interpolateSignalValue(keyframes, playheadPosition);
    const setValue = (newValue: number) => {
        // first we check whether a keyframe already exists at the current playhead position
        const playheadPosition = state.timeline.data.general.playheadPosition;
        const keyframeIds = state.timeline.data.signalKeyframes[signal];
        //const keyframes = keyframeIds.map((kfId: string) => state.timeline.data.keyframeData[kfId]);
        const existingKeyframeId = keyframeIds.find((kfId: string) => state.timeline.data.keyframeData[kfId].frame === playheadPosition);
        //const existingKeyframe = existingKeyframeId ? state.timeline.data.keyframeData[existingKeyframeId] : null;
        let newKeyframeId;
        let newKeyframe = {
                type: "number",
                value: newValue,
                frame: playheadPosition,
                inControls: [0, 0],
                outControls: [0, 0],
        };
        if (!existingKeyframeId) {
            newKeyframeId = `kf_${crypto.randomUUID().substring(0, 8)}`;
        } else {
            newKeyframeId = existingKeyframeId;
        }
        const newState = produce(state, (draft: any) => {
            draft.timeline.data.keyframeData[newKeyframeId] = newKeyframe;
            if (!existingKeyframeId) {
                draft.timeline.data.signalKeyframes[signal].push(newKeyframeId);
            }
        });
        updateState(newState);
    }

    return <div style={{
        height: `${trackHeight}px`, 
        //borderLeft: "2px solid var(--gray2)",
        marginLeft: "25px", 
    }} className={styles.rowStyle}>
        <div style={{ 

        height: `${trackHeight}px`,
        
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: "12px",
        paddingRight: "8px",
        // borderTopLeftRadius: "var(--borderRadiusSmall)",
        // borderBottomLeftRadius: "var(--borderRadiusSmall)"
    }}>
        {signal}
        <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "6px",
            
        }}>
        <Rhombus signal={signal} state={state} updateState={updateState} value={value} setValue={setValue} />
        <Value signal={signal} state={state} value={value} updateState={updateState} setValue={setValue} />

        </div>
    </div>
    </div>
}

export default Signal;