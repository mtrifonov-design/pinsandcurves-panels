import type { PreSceneObject, SceneObject, State } from ".";


function stateToTracks(state: State) {

    const signalToTrack = new Map<string, number>();
    const tracks : PreSceneObject[] = [];
    let currentTrack = 0;

    state.composition.data.layers.forEach(layer => {
        if (state.local.data.hiddenLayers.includes(layer.id)) {
            return;
        }
        currentTrack += 1;
        layer.effects.forEach(effect => {
            if (state.local.data.hiddenEffects.includes(effect.instanceId)) {
                return;
            }
            currentTrack += 1;
            effect.signals.forEach(signal => {
                signalToTrack.set(signal, currentTrack);
                tracks.push({
                    id: signal,
                    __pre_geometry: {
                        x: [0, "screen"],
                        y: [currentTrack,"world"],
                        anchor: "top-left",
                        w: [state.local.data.screen.width, "screen"],
                        h: [1, "world"],
                    },
                });
                currentTrack += 1;
            });
        });
    });

    return { tracks, signalToTrack };
}

export default stateToTracks;