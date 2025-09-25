import type { PreSceneObject, SceneObject, State } from ".";

function stateToSelectionBox(state: any) {

    const selectionBox : PreSceneObject = {
        id: "selectionBox",
        __pre_geometry: {
            x: [0, "screen"],
            y: [0, "screen"],
            anchor: "top-left",
            w: [100, "screen"],
            h: [100, "screen"],
        }
    }
    return selectionBox;

}

export default stateToSelectionBox;