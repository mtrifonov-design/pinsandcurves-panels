
type TimelineData = {
    general: {
        playing: boolean,
        numberOfFrames: number,
        focusRange: [number, number],
        frameRate: number,
        playheadPosition: number
    },
    signals: string[],
    signalMetadata: {
        [signalId: string]: {
            name: string,
        }
    },
    signalKeyframes: {
        [signalId: string]: string[]
    },
    signalRanges: {
        [signalId: string]: [number, number]
    },
    keyframeData: {
        [keyframeId: string]: {
            type: string,
            value: any,
            frame: number,
            inControls: [number, number],
            outControls: [number, number],
        }
    }
};




const defaultTimelineData = {
    epoch: 0,
    data: {
        general: {
            playing: false,
            numberOfFrames: 300,
            focusRange: [0, 150],
            frameRate: 30,
            playheadPosition: 0
        },
        signals: [
            "testSignal", "testSignal2", "testSignal3"
        ],
        signalMetadata: {
            testSignal: {
                name: "Test Signal",
            },
            testSignal2: {
                name: "Test Signal 2",
            },
            testSignal3: {
                name: "Test Signal 3",
            }
        },
        signalKeyframes: {
            testSignal: ["testKeyframe"],
            testSignal2: ["testKeyframe2"],
            testSignal3: ["testKeyframe3"]
        },
        signalRanges: {
            testSignal: [0, 100]
        },
        keyframeData: {
            testKeyframe: {
                type: "number",
                value: 0,
                frame: 0,
                inControls: [0, 0],
                outControls: [0, 0]
            },
            testKeyframe2: {
                type: "number",
                value: 0,
                frame: 15,
                inControls: [0, 0],
                outControls: [0, 0]
            },
            testKeyframe3: {
                type: "number",
                value: 0,
                frame: 7,
                inControls: [0, 0],
                outControls: [0, 0]
            }
        }
    }
};

type CompositionData = {
    canvasDimensions: [number, number],
    compositionName: string,
    layers: {
        id: string,
        effects: {
            instanceId: string,
            signals: string[]
        }[]
    }[]
}

const defaultCompositionData = {
    epoch: 0,
    data: {
        canvasDimensions: [1920, 1080],
        compositionName: "default",
        layers: [
            {
                id: "layer1",
                effects: [
                    {
                        instanceId: "someEffect",
                        signals: ["testSignal","testSignal2"]
                    }
                ]
            },
            {
                id: "layer2",
                effects: [
                    {
                        instanceId: "someEffect2",
                        signals: ["testSignal3"]
                    },
                ]
            },
            {
                id: "layer3",
                effects: [
                    {
                        instanceId: "someEffect3",
                        signals: []
                    }
                ]
            }
        ]

    }
};

type LocalData = {
    viewport: {
        x: number,
        y: number,
        w: number,
        h: number,
    },
    hiddenLayers: string[],
    hiddenEffects: string[],

}

const defaultLocalData = {
    epoch: 0,
    data: {
        viewport: {
            x: 0,
            y: 0,
            w: 15,
            h: 10,
        },
        screen: {
            width: 0,
            height: 0,
        },
        hiddenLayers: [] as string[],
        hiddenEffects: [] as string[]

    }
};

export type { TimelineData, CompositionData, LocalData };
export { defaultTimelineData, defaultCompositionData, defaultLocalData };


