import { ControlsData } from "../../controls";

let colorStopsHash = "";
let cache;
function colorTextureStream(state: ControlsData) {
    const colorStops = [...state.colorStops].sort((a, b) => a.position - b.position);
    if (colorStops[0].position !== 0) {
        const newColorStop = { ...colorStops[0], position: 0 };
        colorStops.push(newColorStop)
    }
    colorStops.sort((a, b) => a.position - b.position);
    if (colorStops[colorStops.length - 1].position !== 1) {
        const newColorStop = { ...colorStops[0], position: 1 };
        colorStops.push(newColorStop);
    }
    colorStops.sort((a, b) => a.position - b.position);
    const hash = JSON.stringify(colorStops);
    if (hash === colorStopsHash && cache !== undefined) {
        return cache;
    }
    colorStopsHash = hash;

    // array filled with 100 zeros
    const colorBuffer = Array(400).fill(0);
    // fill colorstops in first part
    for (let i = 0; i < colorBuffer.length / 4; i++) {
        const pos = i / (colorBuffer.length / 4);
        for (let j = 0; j < colorStops.length; j++) {
            let nextIdx = colorStops.length - 1;
            if (pos <= colorStops[j].position) {
                nextIdx = j;
                const currentIdx = nextIdx - 1 < 0 ? 0 : nextIdx - 1;
                const next = colorStops[nextIdx];
                const current = colorStops[currentIdx];
                const relativePos = (pos - current.position) / ((next.position - current.position) === 0 ? 1 : (next.position - current.position));
                //console.log(pos, current.pos, next.pos);
                colorBuffer[i * 4] = current.color.r + relativePos * (next.color.r - current.color.r);
                colorBuffer[i * 4 + 1] = current.color.g + relativePos * (next.color.g - current.color.g);
                colorBuffer[i * 4 + 2] = current.color.b + relativePos * (next.color.b - current.color.b);
                colorBuffer[i * 4 + 3] = current.position + relativePos * (next.position - current.position);
                //console.log(pos, colorBuffer[i * 4], colorBuffer[i * 4 + 1], colorBuffer[i * 4 + 2]);
                break;
            }

        };
    }
    // since we only need 0 - 255, we need to make sure that the numbers, when serialized, don't have many decimals. so we need to somehow trim them already here
    // the colors are saved 0 - 1, so we just need to get rid of some precision
    colorBuffer.forEach((value, index) => {
        colorBuffer[index] = Math.floor(value * 1000) / 1000;
    });
    const response = {
        versionId: crypto.randomUUID(),
        commands: [{
            resource: "cyberspag_colorTexture",
            type: "setTextureData",
            payload: [colorBuffer]
        }]
    };
    //console.log(response);
    //console.log(colorBuffer)
    cache = response;
    return response;
}

export default colorTextureStream;