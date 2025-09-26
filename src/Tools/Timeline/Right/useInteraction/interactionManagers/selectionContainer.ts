import { SceneObject } from "../../reduceStateToSceneObjects";
import { produce } from "immer";
import { selectionMachine } from "../../../StateMachine";

function invokeSelectionStateMachine(conditionalState: (mState:any) => boolean, event: (mState: any) => any, { state, updateState }: { state: any, updateState: (newState: any) => void }) {
    const machineState = state.local.data.timelineUI.selectionMachineState;
    if (conditionalState(machineState)) {
        console.log("selection machine state in invokeSelectionStateMachine", machineState);
        const newState = selectionMachine(machineState, event(machineState));
        const nextState = produce(state, (draft: any) => {
            draft.local.data.timelineUI.selectionMachineState = newState;
        });
        updateState(nextState);
    }
}


class Manager {
    pointerDown(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        console.log("selection container running")
        invokeSelectionStateMachine((mState) => mState.type === "s_start_no_pins_selected" || mState.type === "s_start_some_pins_selected", 
            () => ({ type: "mousedown_begin_selectionoverlay",
                selectedPinIds: [],
                selectionBox: { x: position.x, y: position.y, w: 0, h: 0 }
            }), 
            { state, updateState }
        );
    }

    pointerMove(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
    }

    pointerUp(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        console.log("pointer up selection box", state.local.data.timelineUI.selectionMachineState);
        invokeSelectionStateMachine((mState) => mState.type === "d_make_selection" && mState.selectedPinIds.length > 0, 
            (s) => ({ type: "mouseup_selectionoverlayCONDnon_empty_selection", selectedPinIds: s.selectedPinIds }), 
            { state, updateState }
        );
        invokeSelectionStateMachine((mState) => mState.type === "d_make_selection" && mState.selectedPinIds.length === 0, 
            (s) => ({ type: "mouseup_selectionoverlayCONDempty_selection", selectedPinIds: s.selectedPinIds }), 
            { state, updateState }
        );

    }
}

export default Manager;