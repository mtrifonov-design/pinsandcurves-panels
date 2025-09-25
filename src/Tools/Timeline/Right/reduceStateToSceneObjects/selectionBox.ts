import type { PreSceneObject, SceneObject, State } from ".";

function stateToSelectionBox(state: any) {

    const selectionBox = state.local.data.timelineUI.selectionMachineState.selectionBox;
    const active = state.local.data.timelineUI.selectionMachineState.type === "d_make_selection";
    if (!active) return;

    const selectionBoxObj : PreSceneObject = {
        id: "selectionBox",
        __pre_geometry: {
            x: [selectionBox ? selectionBox.x : 0, "screen"],
            y: [selectionBox ? selectionBox.y : 0, "screen"],
            anchor: "top-left",
            w: [selectionBox ? selectionBox.w : 0, "screen"],
            h: [selectionBox ? selectionBox.h : 0, "screen"],
        },
        interaction: {
            pointerMove: {
                type: "all",
                manager: "selectionBox"
            }
        }
    }
    return selectionBoxObj;

}

export default stateToSelectionBox;