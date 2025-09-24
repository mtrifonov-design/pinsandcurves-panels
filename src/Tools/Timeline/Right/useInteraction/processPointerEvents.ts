import { SceneObject } from "../reduceStateToSceneObjects";
import PlayheadManager from "./playhead";

function isPointInRect(point: {x: number, y: number}, rect: {x: number, y: number, w: number, h: number}) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}


const Managers = {
    playhead: new PlayheadManager(),
}

function processPointerDown(position: {x: number, y: number}, state: any, updateState: (newState: any) => void, reducedSceneObjects: SceneObject[]) {
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
    console.log("pMove, ", position)
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