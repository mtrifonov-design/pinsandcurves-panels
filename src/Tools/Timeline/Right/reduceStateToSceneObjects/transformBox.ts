import type { PreSceneObject, SceneObject, State } from ".";

function stateToTransformBox(state: any, signalToTrack: Map<string, number>) {

    const selectionBox = state.local.data.timelineUI.selectionMachineState.selectionBox;
    const machineType = state.local.data.timelineUI.selectionMachineState.type;
    const active = machineType === "s_start_some_pins_selected" || machineType === "d_transform_pins";
    if (!active) return;

    const selectedPinIds = state.local.data.timelineUI.selectionMachineState.selectedPinIds;
    const pinsWithTracks = selectedPinIds.map((pinId : string) => {
        const signalId = Object.entries(state.timeline.data.signalKeyframes).find(([key, value]) => value.includes(pinId))?.[0];
        if (!signalId) throw new Error("Rogue pin without a signalId");
        const track = signalToTrack.get(signalId);
        if (track === undefined) throw new Error("Rogue pin without a track (not visible on screen)");
        return { pinId, signalId, track };
    })
    const topLeft = pinsWithTracks.reduce((acc, cur) => {
        return {
            x: Math.min(acc.x, state.timeline.data.keyframeData[cur.pinId]?.frame ?? 0),
            y: Math.min(acc.y, cur.track),
        }
    }, { x: Infinity, y: Infinity });
    const bottomRight = pinsWithTracks.reduce((acc, cur) => {
        return {
            x: Math.max(acc.x, state.timeline.data.keyframeData[cur.pinId]?.frame ?? 0),
            y: Math.max(acc.y, cur.track + 1),
        }
    }, { x: -Infinity, y: -Infinity });
    
    if (topLeft.x === Infinity || topLeft.y === Infinity || bottomRight.x === -Infinity || bottomRight.y === -Infinity) {
        throw new Error("Rogue state in transform box");
    }

    const offsetX = machineType === "d_transform_pins" ? state.local.data.timelineUI.selectionMachineState.offsetX : 0;



    const transformBoxObj : PreSceneObject = {
        id: "transformBox",
        __pre_geometry: {
            x: [topLeft.x, "world"],
            y: [topLeft.y, "world"],
            anchor: "top-left",
            w: [bottomRight.x - topLeft.x, "world"],
            h: [bottomRight.y - topLeft.y, "world"],
        },
        interaction: {
            pointerDown: {
                type: "hit",
                manager: "transformBox",
                cancelEventPropagation: true
            },
            pointerMove: {
                type: "all",
                manager: "transformBox"
            },
            pointerUp: {
                type: "all",
                manager: "transformBox"
            }
        },
        zIndex: 2,
    }
    return transformBoxObj;

}

export default stateToTransformBox;