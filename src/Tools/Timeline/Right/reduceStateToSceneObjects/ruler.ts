import type { PreSceneObject, SceneObject, State } from ".";


function stateToRuler(state: State) {
    const rulerBg : PreSceneObject = {
        id: "ruler",
        renderer: "ruler",
        ruler_type: "background",
        __pre_geometry: {
            x: [0, "screen"],
            y: [0, "screen"],
            anchor: "top-left",
            w: [state.local.data.screen.width, "screen"],
            h: [1, "world"],
        },
    };
    const viewport = state.local.data.viewport;
    const screen = state.local.data.screen;
    const numberOfFramesInView = viewport.w;
    const ticks = [];
    const optimalNumberOfTicks = screen.width / 15;
    const granularities = [1, 5, 15, 30, 150];
    let chosenGranularity = 1;
    let granularitiesIdx = 0;
    while (numberOfFramesInView / chosenGranularity > optimalNumberOfTicks) {
        const granularity = granularitiesIdx < granularities.length ? granularities[granularitiesIdx] : chosenGranularity * 2;
        chosenGranularity = granularity;
        granularitiesIdx++;
    }
    const firstTick = Math.floor(viewport.x / chosenGranularity) * chosenGranularity;
    const lastTick = Math.ceil((viewport.x + viewport.w) / chosenGranularity) * chosenGranularity;
    for (let f = firstTick; f <= lastTick; f += chosenGranularity) {
        const xWorld = f;
        ticks.push({
            id: `ruler_tick_${f}`,
            ruler_type: "tick",
            renderer: "ruler",
            __pre_geometry: {
                x: [xWorld, "world"],
                y: [0, "screen"],
                anchor: "center",
                w: [2, "screen"],
                h: [24, "screen"],
            },
        });
        if (f % (chosenGranularity * 5) === 0) {
            ticks.push({
                id: `ruler_tick_label_${f}`,
                ruler_type: "label",
                renderer: "ruler",
                text: `${f}`,
                font: "10px Arial",
                color: "#ffffffcc",
                __pre_geometry: {
                    x: [xWorld, "world"],
                    y: [24, "screen"],
                    anchor: "center",
                    w: [30, "screen"],
                    h: [18, "screen"],
                },
            });
        }
    }
    return [ rulerBg, ...ticks,];
}

export default stateToRuler;