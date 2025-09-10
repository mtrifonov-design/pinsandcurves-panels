function colorTextureStream() {
    const colorStops = [
        {
            r: .0,
            g: 0.0,
            b: 0.0,
            pos: 0
        },
        {
            r: 1.0,
            g: 1.0,
            b: 0.0,
            pos: 0.4
        },
        {
            r: 1.0,
            g: 1.0,
            b: 0.0,
            pos: 0.5
        },
        {
            r: 1,
            g: 180 / 255,
            b: 0.,
            pos: 0.6
        },
        {
            r: 1.,
            g: 100 / 255,
            b: 0.0,
            pos: 0.7
        },
        {
            r: 1.,
            g: 0,
            b: 0.0,
            pos: .8
        },
        {
            r: 0.,
            g: 0,
            b: 0.0,
            pos: .9
        },
        {
            r: 0.,
            g: 0,
            b: 0.0,
            pos: 1.
        },
    ];
    // array filled with 100 zeros
    const colorBuffer = Array(400).fill(0);
    // fill colorstops in first part
    for (let i = 0; i < colorBuffer.length / 4; i++) {
        const pos = i / (colorBuffer.length / 4);
        for (let j = 0; j < colorStops.length; j++) {
            let nextIdx = colorStops.length - 1;;
            if (pos <= colorStops[j].pos) {
                nextIdx = j;
                const currentIdx = nextIdx - 1 < 0 ? 0 : nextIdx - 1;
                const next = colorStops[nextIdx];
                const current = colorStops[currentIdx];
                const relativePos = (pos - current.pos) / (next.pos - current.pos);
                console.log(pos, current.pos, next.pos);
                colorBuffer[i * 4] = current.r + relativePos * (next.r - current.r);
                colorBuffer[i * 4 + 1] = current.g + relativePos * (next.g - current.g);
                colorBuffer[i * 4 + 2] = current.b + relativePos * (next.b - current.b);
                colorBuffer[i * 4 + 3] = current.pos + relativePos * (next.pos - current.pos);
                //console.log(pos, colorBuffer[i * 4], colorBuffer[i * 4 + 1], colorBuffer[i * 4 + 2]);
                break;
            }

        };
    }
    return {
        versionId: "default",
        commands: [{
            resource: "cyberspag_colorTexture",
            type: "setTextureData",
            payload: [colorBuffer]
        }]
    };
}

export default colorTextureStream;