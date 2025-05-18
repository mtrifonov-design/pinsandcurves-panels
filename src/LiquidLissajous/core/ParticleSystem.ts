// ParticleSystem for Liquid Lissajous
// Each particle: position (vec2), color (vec3)

import { TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import { Controls, ControlsData } from '../LiquidLissajousControls.js';
import { colorConvert } from './colors.js';

function easeInOutCubic(x: number): number {
return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export class ParticleSystem {
    static HARD_MAX = 200;
    buffer: Float32Array;
    time: number;
    CENTER_X: number = 0.5;
    CENTER_Y: number = 0.5;
    BACKGROUND_COLOR: number[] = [0, 0, 0];
    PARTICLE_RADIUS: number = 300;
    PARTICLE_SPEED: number = 0.01;
    PARTICLE_COLORS: number[][] = [[1,0,0],[0,1,0],[0,0,1]];
    PARTICLE_COUNT: number = 3;
    LOOP_LIFECYCLE: number = 60;
    SHOW_LISSAJOUS_FIGURE: boolean = false;
    RATIO_A: number = 1;
    RATIO_B: number = 1;
    OFFSET: number = Math.PI / 2;

    constructor() {
        this.buffer = new Float32Array(ParticleSystem.HARD_MAX * 5);
        this.time = 0;
    }

    // Lissajous curve computation
    lissajousXY(t: number, params: { 
        ax: number, bx: number, ay: number, by: number, 
        deltaX: number, deltaY: number, 
        centerX: number, centerY: number, 
        scaleX: number, scaleY: number 
    }): [number, number] {
        // x = centerX + scaleX * sin(ax * t + deltaX)
        // y = centerY + scaleY * sin(ay * t + deltaY)
        const x = params.centerX + params.scaleX * Math.sin(params.ax * t + params.deltaX);
        const y = params.centerY + params.scaleY * Math.sin(params.ay * t + params.deltaY);
        // const x = params.centerX + params.scaleX * Math.sin(t + Math.PI / 8);
        // const y = params.centerY + params.scaleY * Math.sin(2*t);
        return [x, y];
    }

    update(config: ControlsData, timeline: TimelineController) {
        this.time = timeline.getProject().timelineData.playheadPosition;
        // Create a closed color loop (add first color to end)
        const baseColors = config.particleColors.map(colorConvert);
        const colorLoop = baseColors.length > 0 ? [...baseColors, baseColors[0]] : [[1,0,0],[0,1,0],[0,0,1],[1,0,0]];
        this.PARTICLE_COUNT = config.mixingIntensity * ((colorLoop.length-1) * 4) + (colorLoop.length-1);
        this.LOOP_LIFECYCLE = config.loopLifecycle;

        this.RATIO_A = config.ratioA;
        this.RATIO_B = config.ratioB;
        this.OFFSET = config.offset;
        this.SHOW_LISSAJOUS_FIGURE = config.showLissajousFigure;

        // Interpolate PARTICLE_COUNT color stops in HSL (hue) space
        function rgbToHsl([r, g, b]: number[]): [number, number, number] {
            r = Math.max(0, Math.min(1, r));
            g = Math.max(0, Math.min(1, g));
            b = Math.max(0, Math.min(1, b));
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0, s = 0;
            const l = (max + min) / 2;
            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return [h, s, l];
        }
        function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p: number, q: number, t: number) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return [r, g, b];
        }
        // Build color stops
        const stops = this.PARTICLE_COUNT;
        const colorStops: number[][] = [];
        for (let i = 0; i < stops; ++i) {
            const t = i / stops * (colorLoop.length - 1);
            const idx = Math.floor(t);
            const frac = t - idx;
            const c0 = rgbToHsl(colorLoop[idx]);
            const c1 = rgbToHsl(colorLoop[idx + 1]);
            // Interpolate hue circularly
            let dh = c1[0] - c0[0];
            if (Math.abs(dh) > 0.5) dh -= Math.sign(dh);
            const h = (c0[0] + dh * frac + 1) % 1;
            const s = c0[1] + (c1[1] - c0[1]) * frac;
            const l = c0[2] + (c1[2] - c0[2]) * frac;
            colorStops.push(hslToRgb([h, s, l]));
        }
        this.PARTICLE_COLORS = colorStops;

        // Default Lissajous parameters for a classic figure
        const lissajousParams = {
            ax: this.RATIO_A, bx: 0, 
            ay: this.RATIO_B, by: 0, // frequencies
            deltaX: this.OFFSET, deltaY: 0, // phase offsets
            centerX: this.CENTER_X * 1920,
            centerY: this.CENTER_Y * 1080,
            scaleX: this.PARTICLE_RADIUS, // aspect ratio
            scaleY: this.PARTICLE_RADIUS // aspect ratio
        };

        let ptr = 0;
        function noise1D(x: number): number {
            const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
            return s - Math.floor(s);
        }
        for (let i = 0; i < this.PARTICLE_COUNT; ++i) {
            let t = (this.time % this.LOOP_LIFECYCLE) * 2 * Math.PI / this.LOOP_LIFECYCLE 
            t += (i  / this.PARTICLE_COUNT) * 2 * Math.PI;
            const noiseStrength = 0.0;
            const normalStrength = 0.0;
            const noiseVal = noise1D(i);
            t += noiseVal * noiseStrength;
            let [x, y] = this.lissajousXY(t, lissajousParams);
            const dt = 0.0001;
            const [x2, y2] = this.lissajousXY(t + dt, lissajousParams);
            const dx = x2 - x;
            const dy = y2 - y;
            const len = Math.sqrt(dx*dx + dy*dy) || 1.0;
            const nx = -dy / len;
            const ny = dx / len;
            const normalOffset = (noise1D(i + 1000) - 0.5) * 2 * normalStrength;
            x += nx * normalOffset;
            y += ny * normalOffset;
            const color = this.PARTICLE_COLORS[i];
            this.buffer[ptr++] = x;
            this.buffer[ptr++] = y;
            this.buffer[ptr++] = color[0];
            this.buffer[ptr++] = color[1];
            this.buffer[ptr++] = color[2];
        }
    }
}
