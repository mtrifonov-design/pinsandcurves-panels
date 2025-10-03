import type { PreSceneObject, SceneObject, State } from ".";


function stateToPlayhead(state: State) {

    const objs : PreSceneObject[] = [];

    const playheadLine = {
        id: "playheadLine",
        renderer: "playhead",
        playhead_type: "line",
        __pre_geometry: {
            x: [state.local.data.timelineUI.playheadPosition, "world"],
            y: [0, "screen"],
            anchor: "center",
            w: [2, "screen"],
            h: [state.local.data.screen.height * 2, "screen"],
        },
    }
    const playheadTriangle = {
        id: "playheadTriangle",
        __pre_geometry: {
            x: [state.local.data.timelineUI.playheadPosition, "world"],
            y: [15, "screen"],
            anchor: "center",
            w: [30, "screen"],
            h: [30, "screen"],
        },
        renderer: "playhead",
        playhead_type: "triangle",
        interaction: {
            pointerDown: {
                type: "hit",
                manager: "playhead",
                cancelEventPropagation: true,
            },
            pointerMove: {
                type: "all",
                manager: "playhead"
            },
            pointerUp: {
                type: "all",
                manager: "playhead"
            }
        },
        zIndex: 2,
    }
    objs.push(playheadLine);
    objs.push(playheadTriangle);


    return objs;
}

export default stateToPlayhead;