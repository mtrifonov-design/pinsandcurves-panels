import type { PreSceneObject, SceneObject, State } from ".";


function stateToFocusRange(state: State) {
    const focusRangeBg : PreSceneObject = {
        id: "focusRangeBackground",
        renderer: "focusRange",
        __pre_geometry: {
            x: [state.timeline.data.general.focusRange[0], "world"],
            y: [30, "screen"],
            anchor: "top-left",
            w: [state.timeline.data.general.focusRange[1] - state.timeline.data.general.focusRange[0], "world"],
            h: [0.5, "world"],
        },
    };
    const focusRangeLeftHandle : PreSceneObject = {
        id: "focusRangeLeftHandle",
        renderer: "focusRange",
        handle_type: "handle_left",
        cursor: "ew-resize",
        __pre_geometry: {
            x: [state.timeline.data.general.focusRange[0], "world"],
            y: [30, "screen"],
            anchor: "top-center",
            w: [15, "screen"],
            h: [0.5, "world"],
        },
        interaction: {
            pointerDown: {
                type: "hit",
                manager: "focusRange",
                cancelEventPropagation: true,
            },
            pointerMove: {
                type: "all",
                manager: "focusRange"
            },
            pointerUp: {
                type: "all",
                manager: "focusRange"
            }
        },
        zIndex: 1.5,
    };
    const focusRangeRightHandle : PreSceneObject = {
        id: "focusRangeRightHandle",
        renderer: "focusRange",
        handle_type: "handle_right",
        cursor: "ew-resize",
        __pre_geometry: {
            x: [state.timeline.data.general.focusRange[1], "world"],
            y: [30, "screen"],
            anchor: "top-center",
            w: [15, "screen"],
            h: [0.5, "world"],
        },
        interaction: {
            pointerDown: {
                type: "hit",
                manager: "focusRange",
                cancelEventPropagation: true,
            },
            pointerMove: {
                type: "all",
                manager: "focusRange"
            },
            pointerUp: {
                type: "all",
                manager: "focusRange"
            }
        },
        zIndex: 1.5,
    };
    return [ focusRangeBg, focusRangeLeftHandle, focusRangeRightHandle];
}

export default stateToFocusRange;