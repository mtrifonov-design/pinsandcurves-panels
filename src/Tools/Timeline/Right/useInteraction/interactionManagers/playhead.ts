import { SceneObject } from "../../reduceStateToSceneObjects";
import { produce } from "immer";

class Manager {

    pointerDown(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        const nextState = produce(state, (draft: any) => {
            draft.local.data.timelineUI.draggingPlayhead = true;
        });
        updateState(nextState);
        
    }

    pointerMove(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[], self: SceneObject) {
        if (!state.local.data.timelineUI.draggingPlayhead) return;
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
        const nextState = produce(state, (draft: any) => {
            draft.local.data.timelineUI.draggingPlayhead = false;
        });
        updateState(nextState);
    }
}

export default Manager;