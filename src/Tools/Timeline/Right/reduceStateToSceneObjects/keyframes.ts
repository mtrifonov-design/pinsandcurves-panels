import { PreSceneObject, State } from ".";


function stateToKeyframes(state: State, signalToTrack: Map<string, number>) {
    const keyframes :  PreSceneObject[] = [];
    Object.values(state.timeline.data.signals).forEach(signal => {
        const track = signalToTrack.get(signal);
        if (track === undefined) return;
        const signalKeyframes = state.timeline.data.signalKeyframes[signal];
        Object.values(signalKeyframes).forEach(kfId => {
            const kf = state.timeline.data.keyframeData[kfId];
            if (kf && track !== undefined) {
                keyframes.push({
                    id: `${kfId}`,
                    isKeyframe: true,
                    __pre_geometry: {
                        x: [kf.frame, "world"],
                        y: [track + 0.5, "world"],
                        anchor: "center",
                        w: [20, "screen"],
                        h: [20, "screen"],
                    },
                    keyframe: kf,
                    interaction: {
                        pointerDown: {
                            type: "hit",
                            manager: "keyframe",
                            cancelEventPropagation: true,
                        },
                        pointerMove: {
                            type: "all",
                            manager: "keyframe"
                        },
                        pointerUp: {
                            type: "all",
                            manager: "keyframe",
                        }
                    },
                    zIndex: 3,
                });
            } else {
                console.warn("Keyframe or track not found for signal", signal, kfId, kf, track);
            }
        });
    });
    return { keyframes };
}

export default stateToKeyframes;