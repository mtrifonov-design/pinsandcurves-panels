import type { PreSceneObject, SceneObject, State } from ".";


function stateToPlayhead(state: State) {

    const objs : PreSceneObject[] = [];

    const playheadLine = {
        id: "playheadLine",
        __pre_geometry: {
            x: [state.timeline.data.general.playheadPosition, "world"],
            y: [0, "screen"],
            anchor: "center",
            w: [2, "screen"],
            h: [state.local.data.screen.height * 2, "screen"],
        },
    }
    const playheadTriangle = {
        id: "playheadTriangle",
        __pre_geometry: {
            x: [state.timeline.data.general.playheadPosition, "world"],
            y: [15, "screen"],
            anchor: "center",
            w: [30, "screen"],
            h: [30, "screen"],
        },
        interaction: {
            pointerDown: {
                type: "hit",
                manager: "playhead"
            },
            pointerMove: {
                type: "all",
                manager: "playhead"
            },
            pointerUp: {
                type: "all",
                manager: "playhead"
            }
        }
    }
    objs.push(playheadTriangle);
    objs.push(playheadLine);

    return objs;
}

export default stateToPlayhead;