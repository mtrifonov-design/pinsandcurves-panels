import { SceneObject } from "../../reduceStateToSceneObjects";
import { produce } from "immer";
import { selectionMachine } from "../selectionStateMachine";

const boxesIntersect = (boxA: {x: number, y: number, w: number, h: number}, boxB: {x: number, y: number, w: number, h: number}) => {
    return (boxA.x < boxB.x + boxB.w &&
            boxA.x + boxA.w > boxB.x &&
            boxA.y < boxB.y + boxB.h &&
            boxA.y + boxA.h > boxB.y);
};

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
    }
    pointerMove(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        invokeSelectionStateMachine(
            (mState) => mState.type === "d_make_selection", 
            (mState: any) => {
                const box = {
                    x: mState.selectionBox.x,
                    y: mState.selectionBox.y,
                    w: position.x - mState.selectionBox.x,
                    h: position.y - mState.selectionBox.y,
                }
                const keyframeObjs = reducedSceneObjects.filter(obj => obj.isKeyframe)
                .filter(kfObj => boxesIntersect(box, kfObj.geometry as {x: number, y: number, w: number, h: number}));
                console.log(reducedSceneObjects.filter(obj => obj.isKeyframe));
                console.log(keyframeObjs)
                const selectedPinIds = keyframeObjs.map(kfObj => kfObj.id);
                return ({ type: "mousemove_selectionoverlay",
                    selectedPinIds: selectedPinIds,
                    selectionBox: box,
                });
            },
            { state, updateState }
        );
    }

    pointerUp(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
    }
}

export default Manager;