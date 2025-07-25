//import { LISSAJOUS_CURVES } from "../core/lissajousCurves";

const presets = {
    
    pastelDream: {
        particleCount: 10,
        particleColors: [
            [255, 45, 209],
            [253, 255, 184],
            [77, 255, 190],
            [99, 200, 255],
        ],
        backgroundColor: [0, 0, 0],
        loopLifecycle: 300,
        mixingIntensity: 0.3,
        ratioA: 1,
        ratioB: 2,
        offset: Math.PI / 2,
        width: 1920,
        height: 1080,
        figureScaleX: 0.2,
        figureScaleY: 0.3,
        noiseEnabled: true,
        noiseScale: 0.1,
        noiseIntensity: 0.1,
        noiseSpeed: 0.1,
        fluidWarpEnabled: true,
        fluidWarpIntensity: 0.1,
        fluidWarpScale: 0.1,
        fluidWarpSpeed: 0.1,
        animationSpeed: 0.2,
        rotateVertical: 0,
        rotateHorizontal: 0,
    },

};

export default presets;

