import { Button } from "@mtrifonov-design/pinsandcurves-design";
import { produce } from "immer";



const easingRowStyle = {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
    justifyContent: "space-between",
    alignItems: "center",
}

const easingOptionsStyle = {
    display: "flex",
    flexDirection: "row",
    gap: "8px",
}

function EasingButton({ easingType, selectedEasingType, onClick, inOrOut }) {
    const isSelected = easingType === selectedEasingType;
    return <div style={{
        backgroundColor: isSelected ? "var(--gray7)" : "var(--gray3)",
        borderRadius: "var(--borderRadiusSmall)",
        padding: "4px 8px",
        cursor: "pointer",
    }}
        onClick={() => onClick(easingType, inOrOut)}>
        {easingType}
    </div>
}

function Inner({ state, updateState }) {

    const machineState = state.local.data.timelineUI.selectionMachineState;
    const selectedPins = machineState.selectedPinIds.map(pinId => {
        return state.timeline.data.keyframeData[pinId];
    });
    const inEasing = selectedPins.every(pin => pin.inControls[0] === 0 && pin.inControls[1] === 0) ? "linear" : selectedPins.every(pin => pin.inControls[0] === 0.58 && pin.inControls[1] === 1) ? "eased" : "custom";
    const outEasing = selectedPins.every(pin => pin.outControls[0] === 0 && pin.outControls[1] === 0) ? "linear" : selectedPins.every(pin => pin.outControls[0] === 0.42 && pin.outControls[1] === 0) ? "eased" : "custom";

    const updateEasing = (easingType: string, inOrOut: "in" | "out") => {
        const nextState = produce(state, (draft: any) => {
            machineState.selectedPinIds.forEach(pinId => {
                if (easingType === "linear" && inOrOut === "in") {
                    draft.timeline.data.keyframeData[pinId].inControls = [0, 0];
                } else if (easingType === "eased" && inOrOut === "in") {
                    draft.timeline.data.keyframeData[pinId].inControls = [0.58, 1];
                } else if (easingType === "linear" && inOrOut === "out") {
                    draft.timeline.data.keyframeData[pinId].outControls = [0, 0];
                } else if (easingType === "eased" && inOrOut === "out") {
                    draft.timeline.data.keyframeData[pinId].outControls = [0.42, 0];
                }
            });
        });
        updateState(nextState);
    }

    return <div style={{
        backgroundColor: "#A48E20",
        borderRadius: "var(--borderRadiusSmall)",
        padding: "4px 8px",
    }}>
        keyframe easing
        <div>
            <div style={easingRowStyle}>
                <div>in</div>
                <div style={easingOptionsStyle}>
                    <EasingButton easingType="linear" inOrOut={"in"} selectedEasingType={inEasing} onClick={updateEasing} />
                    <EasingButton easingType="eased" inOrOut={"in"} selectedEasingType={inEasing} onClick={updateEasing} />
                </div>
            </div>
            <div style={easingRowStyle}>
                <div>out</div>
                <div style={easingOptionsStyle}>
                    <EasingButton easingType="linear" inOrOut={"out"} selectedEasingType={outEasing} onClick={updateEasing} />
                    <EasingButton easingType="eased" inOrOut={"out"} selectedEasingType={outEasing} onClick={updateEasing} />
                </div>
            </div>
        </div>
    </div>
}

function InterpolationOverlay({ state, updateState }) {
    const active = state.local.data.timelineUI.selectionMachineState.type === "s_start_some_pins_selected";
    return active ? <Inner state={state} updateState={updateState} /> : null;
}

export default InterpolationOverlay;