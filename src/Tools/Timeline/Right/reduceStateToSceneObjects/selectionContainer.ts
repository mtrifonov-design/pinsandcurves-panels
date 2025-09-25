import type { PreSceneObject, SceneObject, State } from ".";

function stateToSelectionContainer(state: any) {
    const selectionContainer : PreSceneObject = {
        id: "selectionContainer",
        __pre_geometry: {
            x: [0, "screen"],
            y: [0, "screen"],
            anchor: "top-left",
            w: [state.local.data.screen.width, "screen"],
            h: [state.local.data.screen.height, "screen"],
        },
        interaction: {
            pointerDown: {
                type: "hit",
                manager: "selectionContainer",
                cancelEventPropagation: true,
            },
            pointerUp: {
                type: "hit",
                manager: "selectionContainer",
            }
        },
        zIndex: 1,
    }
    return selectionContainer;
}

export default stateToSelectionContainer;
