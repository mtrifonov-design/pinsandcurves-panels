import { ControlsData } from "../../CyberSpaghettiControls";

let cache;
let pressure;
function rayInstanceStream(state: ControlsData) {

    const instances = [];
    for (let i = 0; i < 1000; i++) {
        instances.push(Math.random());
    }

    if (pressure === state.pressure) {
        return cache;
    }

    pressure = state.pressure;
    cache = {
        versionId: crypto.randomUUID(),
        commands: [{
            resource: "cyberspag_ray",
            type: "setInstanceData",
            payload: [{}, 200 + 600 * state.pressure]
        }]
    }
    return cache;
};

export default rayInstanceStream;