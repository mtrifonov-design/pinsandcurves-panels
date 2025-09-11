import { ControlsData } from "../../CyberSpaghettiControls";

let cache;
let sliceCache;
function globalStream(state: ControlsData) {
    const stateSlice = {
        centerX: state.centerX,
        centerY: state.centerY,
        centerZ: state.centerZ,
        temperature: state.temperature,
        pressure: state.pressure
    }

    if (JSON.stringify(stateSlice) === sliceCache) {
        return cache;
    }

    sliceCache = JSON.stringify(stateSlice);
    cache = {
        versionId: crypto.randomUUID(),
        commands: [{
            resource: "cyberspag_globals",
            type: "setGlobals",
            payload: [{
                origin: [state.centerX, state.centerY, state.centerZ, 0],
                temperature: [state.temperature],
                pressure: [state.pressure]
            }]
        }, {
            resource: "cyberspag_blur",
            type: "setGlobals",
            payload: [{
                amount: [state.temperature]
            }]
        }
        ],
    };
    return cache;
}

export default globalStream;