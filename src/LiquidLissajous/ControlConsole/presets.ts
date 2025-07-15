import { LISSAJOUS_CURVES } from "../core/lissajousCurves";

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
        showLissajousFigure: false,
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
        lissajousParams: LISSAJOUS_CURVES[0],
        animationSpeed: 0.2,
        rotateVertical: 0,
        rotateHorizontal: 0,
    },
    // rgb(59, 6, 10)
    // rgb(138, 0, 0)
    // rgb(200, 63, 18)
    // rgb(255, 242, 135)
    burningSunset: {
        particleCount: 10,
        particleColors: [
            [59, 6, 10],
            [138, 0, 0],
            [200, 63, 18],
            [255, 242, 135],
        ],
        backgroundColor: [0, 0, 0],
        loopLifecycle: 300,
        mixingIntensity: 0.6,
        showLissajousFigure: false,
        ratioA: 1,
        ratioB: 2,
        offset: Math.PI / 2,
        width: 1920,
        height: 1080,
        figureScaleX: 0.2,
        figureScaleY: 0.3,
        noiseEnabled: true,
        noiseScale: 0.1,
        noiseIntensity: 0.65,
        noiseSpeed: 0.1,
        fluidWarpEnabled: true,
        fluidWarpIntensity: 0.1,
        fluidWarpScale: 0.1,
        fluidWarpSpeed: 0.1,
        lissajousParams: LISSAJOUS_CURVES[0],
        animationSpeed: 0.2,
        rotateVertical: 0,
        rotateHorizontal: 0,
    },

    // rgb(84, 9, 218)
    // rgb(78, 113, 255)
    // rgb(141, 216, 255)
    // rgb(187, 251, 255)
    oceanBlues: {
        particleCount: 10,
        particleColors: [
            [84, 9, 218],
            [78, 113, 255],
            [141, 216, 255],
            [187, 251, 255],
        ],
        backgroundColor: [0, 0, 0],
        loopLifecycle: 300,
        mixingIntensity: 1,
        showLissajousFigure: false,
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
        lissajousParams: LISSAJOUS_CURVES[0],
        animationSpeed: 0.15,
        rotateVertical: 0,
        rotateHorizontal: 0,
    },

    //    rgb(172, 23, 84)
    // rgb(229, 56, 136)
    // rgb(243, 113, 153)
    // rgb(247, 168, 196)
    hotPink: {
        particleCount: 10,
        particleColors: [
            [172, 23, 84],
            [229, 56, 136],
            [243, 113, 153],
            [247, 168, 196],
        ],
        backgroundColor: [0, 0, 0],
        loopLifecycle: 300,
        mixingIntensity: 0.5,
        showLissajousFigure: false,
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
        lissajousParams: LISSAJOUS_CURVES[0],
        animationSpeed: 0.3,
        rotateVertical: 0,
        rotateHorizontal: 0,
    },

    //    rgb(47, 82, 73)
    // rgb(67, 112, 87)
    // rgb(151, 176, 103)
    // rgb(227, 222, 97)
    forestGreens: {
        particleCount: 10,
        particleColors: [
            [47, 82, 73],
            [67, 112, 87],
            [151, 176, 103],
            [227, 222, 97],
        ],
        backgroundColor: [0, 0, 0],
        loopLifecycle: 300,
        mixingIntensity: 0.45,
        showLissajousFigure: false,
        ratioA: 1,
        ratioB: 2,
        offset: Math.PI / 2,
        width: 1920,
        height: 1080,
        figureScaleX: 0.2,
        figureScaleY: 0.3,
        noiseEnabled: true,
        noiseScale: 0.1,
        noiseIntensity: 0.3,
        noiseSpeed: 0.1,
        fluidWarpEnabled: true,
        fluidWarpIntensity: 0.1,
        fluidWarpScale: 0.1,
        fluidWarpSpeed: 0.1,
        lissajousParams: LISSAJOUS_CURVES[0],
        animationSpeed: 0.2,
        rotateVertical: 0,
        rotateHorizontal: 0,
    },

        //    rgb(24, 1, 97)
    // rgb(79, 23, 135)
    // rgb(235, 54, 120)
    // rgb(251, 119, 60)
    tropicalDisco: {
        particleCount: 10,
        particleColors: [
            [24, 1, 97],
            [79, 23, 135],
            [235, 54, 120],
            [251, 119, 60],
        ],
        backgroundColor: [0, 0, 0],
        loopLifecycle: 300,
        mixingIntensity: 0.3,
        showLissajousFigure: false,
        ratioA: 1,
        ratioB: 2,
        offset: Math.PI / 2,
        width: 1920,
        height: 1080,
        figureScaleX: 0.2,
        figureScaleY: 0.3,
        noiseEnabled: true,
        noiseScale: 0.1,
        noiseIntensity: 0.5,
        noiseSpeed: 0.1,
        fluidWarpEnabled: true,
        fluidWarpIntensity: 0.1,
        fluidWarpScale: 0.1,
        fluidWarpSpeed: 0.1,
        lissajousParams: LISSAJOUS_CURVES[0],
        animationSpeed: 0.4,
        rotateVertical: 0,
        rotateHorizontal: 0,
    },

};

export default presets;

