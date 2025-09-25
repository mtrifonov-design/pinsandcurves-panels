import { SceneObject } from "../reduceStateToSceneObjects";
import PlayheadManager from "./interactionManagers/playhead";
import KeyframeManager from "./interactionManagers/keyframe";
import SelectionBoxManager from "./interactionManagers/selectionBox";
import SelectionContainerManager from "./interactionManagers/selectionContainer";
import TransformBoxManager from "./interactionManagers/transformBox";

function isPointInRect(point: {x: number, y: number}, rect: {x: number, y: number, w: number, h: number}) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

const Managers = {
    playhead: new PlayheadManager(),
    keyframe: new KeyframeManager(),
    selectionBox: new SelectionBoxManager(),
    selectionContainer: new SelectionContainerManager(),
    transformBox: new TransformBoxManager(),
}

function sortByZIndex(a: SceneObject, b: SceneObject) {
    const zA = a.zIndex || 0;
    const zB = b.zIndex || 0;
    return zA - zB;
}

function processPointerDown(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[]) {
    reducedSceneObjects = [...reducedSceneObjects].sort(sortByZIndex).reverse();
    for (let obj of reducedSceneObjects) {
        if (!obj.interaction) continue;
        if (!obj.interaction.pointerDown) continue;
        if (obj.interaction.pointerDown.type === "hit") {
            const geom = obj.geometry;
            if (!isPointInRect(position, geom)) continue;
        }
        const manager = Managers[obj.interaction.pointerDown.manager];
        if (manager && manager.pointerDown) {
            manager.pointerDown(position, state, updateState, reducedSceneObjects, obj);
        }
    }
}

function processPointerMove(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[]) {
    reducedSceneObjects = [...reducedSceneObjects].sort(sortByZIndex).reverse();
    for (let obj of reducedSceneObjects) {
        if (!obj.interaction) continue;
        if (!obj.interaction.pointerMove) continue;
        if (obj.interaction.pointerMove.type === "hit") {
            const geom = obj.geometry;
            if (!isPointInRect(position, geom)) continue;
        }
        const manager = Managers[obj.interaction.pointerMove.manager];
        if (manager && manager.pointerMove) {
            manager.pointerMove(position, state, updateState, reducedSceneObjects, obj);
        }
    }   
}

function processPointerUp(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[]) {
    reducedSceneObjects = [...reducedSceneObjects].sort(sortByZIndex).reverse();
    for (let obj of reducedSceneObjects) {
        if (!obj.interaction) continue;
        if (!obj.interaction.pointerUp) continue;
        if (obj.interaction.pointerUp.type === "hit") {
            const geom = obj.geometry;
            if (!isPointInRect(position, geom)) continue;
        }
        const manager = Managers[obj.interaction.pointerUp.manager];
        if (manager && manager.pointerUp) {
            manager.pointerUp(position, state, updateState, reducedSceneObjects, obj);
        }
    }       
}

export { processPointerDown, processPointerMove, processPointerUp };