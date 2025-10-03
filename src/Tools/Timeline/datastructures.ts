import { SelectionMachineState } from "./StateMachine";

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
            playheadPosition: 0
        },
        signals: [
            "exampleCircle_signal1"
        ],
        signalMetadata: {
            exampleCircle_signal1: {
                name: "Test Signal",
            },
        },
        signalKeyframes: {
            exampleCircle_signal1: ["testKeyframe"]
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

type CompositionData = {
    canvasDimensions: [number, number],
    compositionName: string,
    layers: {
        id: string,
        effects: {
            instanceId: string,
            signals: {
                [signalName: string]: string
            }
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
                name: "Layer 1",
                effects: [
                ]
            },
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
    selection: {
        currentSelection: {
            type: "keyframe" | "effect" | "layer" | null,
            contents: string[];
        },
        dashboardSelection: {
            type: "keyframe" | "effect" | "layer" | null,
            contents: string[];
        }
    },
    timelineUI: {
        selectionMachineState: SelectionMachineState,
        playheadPosition: number,
    },
    screen: {
        width: number,
        height: number,
    }



}

const defaultLocalData = {
    epoch: 0,
    data: {
        viewport: {
            x: -1,
            y: 0,
            w: 100,
            h: 10,
        },
        screen: {
            width: 0,
            height: 0,
        },
        hiddenLayers: [] as string[],
        hiddenEffects: [] as string[],
        selection: {
            currentSelection: {
                type: null,
                contents: [] as string[],
            },
            dashboardSelection: {
                type: null,
                contents: [] as string[],
            }
        },
        timelineUI: {
            selectionMachineState: {
                type: "s_start_no_pins_selected",
            },
            playheadPosition: 0,
        }
    }
};

export type { TimelineData, CompositionData, LocalData };
export { defaultTimelineData, defaultCompositionData, defaultLocalData };


