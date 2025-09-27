type TimelineData = {
    general: {
        playing: boolean,
        playingTimestamp: number,
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
            playingTimestamp: 0,
            numberOfFrames: 300,
            focusRange: [0, 150],
            frameRate: 30,
            playheadPosition: 12
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

export type { TimelineData };
export { defaultTimelineData };


