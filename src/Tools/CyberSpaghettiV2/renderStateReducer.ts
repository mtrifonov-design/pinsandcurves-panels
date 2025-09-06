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
const instances = [];
for (let i = 0; i < 100; i++) {
    instances.push(Math.random());
}


function renderStateReducer(state: any) {
    const renderState = {
        defaultStream: {
            versionId: "default",
            commands: [
                {
                    resource: "raytunnel_quad",
                    type: "setVertices",
                    payload: [
                        {
                            position:
                                [
                                    -1, -1,
                                    1, -1,
                                    -1, 1,
                                    1, 1
                                ]
                        },
                        [
                            0, 1, 2, 2, 1, 3
                        ],
                        2
                    ]
                },
                {
                    resource: "v",
                    type: "setVertices",
                    payload: [
                        {
                            position: [
                                -1, -1,
                                1, -1,
                                -1, 1,
                                1, 1
                            ]
                        },
                        [
                            0, 1, 2, 2, 1, 3
                        ],
                        2
                    ]
                },
                {
                    resource: "g",
                    type: "setGlobals",
                    payload: [{
                        screenSize: [1920, 1080],
                        blurScale: [4],
                    }]
                },
                {
                    resource: "raytunnel_colorTex",
                    type: "setTextureData",
                    payload: [colorBuffer]
                },
                {
                    resource: "raytunnel_global",
                    type: "setGlobals",
                    payload: [{
                        tunnelData: [-0.1, Math.sqrt(0.5), 100, 0],
                        rayData: [1, 0.01, 0.2, 0.2],
                        time: [5],
                        colorVarianceFactor: [0.6],
                        chaos: [0.5]
                    }]
                },
                {
                    resource: "raytunnel_ray",
                    type: "setInstanceData",
                    payload: [{
                        seed: instances
                    }, instances.length]
                }

            ]
        },
        setupStream: {
            version: "0",
            commands: [
                {
                    resource: undefined,
                    type: "setScreen",
                    payload: ["out"]
                }
            ]
        },
    };
    return renderState;
}

export default renderStateReducer;