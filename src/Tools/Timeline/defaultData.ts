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
            "testSignal"
        ],
        signalMetadata: {
            testSignal: {
                name: "Test Signal",
            }
        }, 
        signalKeyframes: {
            testSignal: ["testKeyframe"]
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
            }
        }
    }
};
const defaultCompositionData = {
    epoch: 0,
    data: {
        canvasDimensions: [1920, 1080],
        compositionName: "default",
        layers: [
            {
                effects: [
                    {
                        instanceId: "someEffect",
                        signals: ["testSignal"]
                    }
                ]
            }
        ]

    }
};

const defaultLocalData = {
    epoch: 0,
    data: {}
};

export { defaultTimelineData, defaultCompositionData, defaultLocalData };


