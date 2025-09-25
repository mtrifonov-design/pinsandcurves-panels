
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
        console.log(nextState)
        return updateState(nextState);
    }
}

class Manager {
    
    pointerDown(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        console.log("keyframe manager running",self)
        invokeSelectionStateMachine((mState) => mState.type === "s_start_no_pins_selected" || mState.type === "s_start_some_pins_selected",
            (mState: any) => {
                const positionXWorld = (position.x / state.local.data.screen.width) * state.local.data.viewport.w + state.local.data.viewport.x;
                const frame = state.timeline.data.keyframeData[mState.selectedPinIds[0]].frame;
                return ({ type: "mousedown_single_pin", pinId: self.id,
                initial: {
                    id: mState.selectedPinIds[0], 
                    frame: frame,
                    initialPositionX: positionXWorld,
                    position: "right",
                    span: 0,
                    type: "translate"
                }
              })},
            { state, updateState }
        );

    }

    pointerMove(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
    }

    pointerUp(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
    }
}

export default Manager;