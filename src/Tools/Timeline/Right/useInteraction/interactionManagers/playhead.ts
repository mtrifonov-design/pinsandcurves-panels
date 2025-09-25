import { SceneObject } from "../../reduceStateToSceneObjects";
import { produce } from "immer";
import { selectionMachine } from "../selectionStateMachine";

function invokeSelectionStateMachine(conditionalState: (mState:any) => boolean, event: (mState: any) => any, { state, updateState }: { state: any, updateState: (newState: any) => void }) {
    const machineState = state.local.data.timelineUI.selectionMachineState;
    if (conditionalState(machineState)) {
        const newState = selectionMachine(machineState, event(machineState));
        const nextState = produce(state, (draft: any) => {
            draft.local.data.timelineUI.selectionMachineState = newState;
        });
        return updateState(nextState);
    }
}

class Manager {

    pointerDown(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        invokeSelectionStateMachine((mState) => mState.type === "s_start_no_pins_selected" || mState.type === "s_start_some_pins_selected",
            () => ({ type: "mousedown_playhead" }),
            { state, updateState }
        );
    }

    pointerMove(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        const machineState = state.local.data.timelineUI.selectionMachineState;
        if (machineState.type !== "d_drag_playhead") {
            return;
        }
        const viewport = state.local.data.viewport;
        const screen = state.local.data.screen;
        const xWorld = (position.x / screen.width) * viewport.w + viewport.x;
        const frame = Math.round(xWorld);
        const nextState = produce(state, (draft: any) => {
            draft.timeline.data.general.playheadPosition = frame;
        });
        updateState(nextState);
    }

    pointerUp(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        invokeSelectionStateMachine((mState) => mState.type === "d_drag_playhead",
            () => ({ type: "mouseup_playhead" }),
            { state, updateState }
        );
    }
}

export default Manager;