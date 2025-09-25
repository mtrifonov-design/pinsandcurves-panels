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
        invokeSelectionStateMachine((mState) => mState.type === "s_start_some_pins_selected", 
            (s) => {
                const positionXWorld = (position.x / state.local.data.screen.width) * state.local.data.viewport.w + state.local.data.viewport.x;
                const frame = state.timeline.data.keyframeData[s.selectedPinIds[0]].frame;
                return ({ type: "mousedown_transform_overlay", selectedPinIds: s.selectedPinIds,
                initial: {
                    id: s.selectedPinIds[0], 
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
        invokeSelectionStateMachine((mState) => mState.type === "d_transform_pins", 
            (s) => {
                const positionXWorld = (position.x / state.local.data.screen.width) * state.local.data.viewport.w + state.local.data.viewport.x;
                const offsetX = positionXWorld - s.initial.initialPositionX;
            return ({ type: "mousemove_transform_box", 
                offsetX: offsetX,
                scaleX: 1
            })}, 
            { state, updateState }
        );

    }

    pointerUp(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        console.log("pointer up transform box")
        invokeSelectionStateMachine((mState) => mState.type === "d_transform_pins", 
            (s) => ({ type: "mouseup_transform_box", selectedPinIds: s.selectedPinIds }), 
            { state, updateState }
        );
    }
}

export default Manager;