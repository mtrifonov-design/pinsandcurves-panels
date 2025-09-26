import { produce } from "immer";
import invokeSelectionStateMachine from "./StateMachine/invokeStateMachine";


function keyHandler(e: KeyboardEvent, state: any, updateState: (newState: any) => void) {
    const key = e.key;
    if (key === "Delete" || key === "Backspace") {
        invokeSelectionStateMachine(
            (mState) => mState.type === "s_start_some_pins_selected",
            (s) => ({ type: "delete_selected_pins" }),
            { state, updateState,
                preCondProcessor: (newState) => {
                    let nextState = produce(newState, (draft: any) => {
                        const selectedPinIds = draft.local.data.timelineUI.selectionMachineState.selectedPinIds;
                        draft.timeline.data.keyframeData = Object.fromEntries(
                            Object.entries(draft.timeline.data.keyframeData).filter(([id, _]) => !selectedPinIds.includes(id))
                        );
                        for (let [signalId, keyframes] of Object.entries(draft.timeline.data.signalKeyframes)) {
                            draft.timeline.data.signalKeyframes[signalId] = keyframes.filter((kfId: any) => !selectedPinIds.includes(kfId));
                        }
                    });
                    console.log("after del", nextState)
                    return nextState;
                }
            }
        )
    }
}

export default keyHandler;