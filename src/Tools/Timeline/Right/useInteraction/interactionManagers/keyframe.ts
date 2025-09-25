
import { SceneObject } from "../../reduceStateToSceneObjects";
import { produce } from "immer";
import { selectionMachine } from "../selectionStateMachine";

function invokeSelectionStateMachine(conditionalState: (mState:any) => boolean, event: (mState: any) => any, { state, updateState }: { state: any, updateState: (newState: any) => void }) {
    const machineState = state.local.data.timelineUI.selectionMachine.state;
    if (conditionalState(machineState)) {
        const newState = selectionMachine(machineState, event(machineState));
        const nextState = produce(state, (draft: any) => {
            draft.local.data.timelineUI.selectionMachine.state = newState;
        });
        updateState(nextState);
    }
}

class Manager {

    pointerDown(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        invokeSelectionStateMachine((mState) => mState.type === "s_start_no_pins_selected",
            () => ({ type: "mousedown_single_pin", selectedPinIds: self.id ? [self.id] : [] }),
            { state, updateState }
        );
        invokeSelectionStateMachine((mState) => mState.type === "s_start_some_pins_selected",
            () => ({ type: "mousedown_single_pin", selectedPinIds: self.id ? [self.id] : [] }),
            { state, updateState }
        );
    }

    pointerMove(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
    }

    pointerUp(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
    }
}

export default Manager;