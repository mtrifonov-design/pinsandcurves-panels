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
    PARTICLE_RADIUS: number = 800;
    PARTICLE_SPEED: number = 0.01;
    PARTICLE_COLORS: number[][] = [[1,0,0],[0,1,0],[0,0,1]];
    PARTICLE_COUNT: number = 3;
    LOOP_LIFECYCLE: number = 60;

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
        return [x, y];
    }

    update(config: ControlsData, timeline: TimelineController) {
        this.time = timeline.getProject().timelineData.playheadPosition;
        this.PARTICLE_COLORS = config.particleColors.map(colorConvert);
        this.PARTICLE_COUNT = config.mixingIntensity * (this.PARTICLE_COLORS.length * 4) + this.PARTICLE_COLORS.length;
        this.LOOP_LIFECYCLE = config.loopLifecycle;

        // Default Lissajous parameters for a classic figure
        const lissajousParams = {
            ax: 3, bx: 0, ay: 2, by: 0, // frequencies
            deltaX: Math.PI / 2, deltaY: 0, // phase offsets
            centerX: this.CENTER_X * 1920,
            centerY: this.CENTER_Y * 1080,
            scaleX: this.PARTICLE_RADIUS, // aspect ratio
            scaleY: this.PARTICLE_RADIUS // aspect ratio
        };

        let ptr = 0;
        // Deterministic noise function (simple 1D value noise)
        function noise1D(x: number): number {
            // A simple hash-based noise, deterministic for each i
            const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
            return s - Math.floor(s);
        }
        for (let i = 0; i < this.PARTICLE_COUNT; ++i) {
            // Distribute particles along the curve
            let t = (this.time % this.LOOP_LIFECYCLE) * 2 * Math.PI / this.LOOP_LIFECYCLE 
            t += (i  / this.PARTICLE_COUNT) * 2 * Math.PI;
            // Add deterministic noise to t
            const noiseStrength = 0.0; // Adjust for more/less impact
            const normalStrength = 0.0; // Offset along normal (pixels)
            const noiseVal = noise1D(i);
            t += noiseVal * noiseStrength;
            // Compute base (x, y) on Lissajous
            let [x, y] = this.lissajousXY(t, lissajousParams);
            // Compute tangent and normal at t
            const dt = 0.0001;
            const [x2, y2] = this.lissajousXY(t + dt, lissajousParams);
            const dx = x2 - x;
            const dy = y2 - y;
            const len = Math.sqrt(dx*dx + dy*dy) || 1.0;
            // Normal vector (perpendicular, right-hand)
            const nx = -dy / len;
            const ny = dx / len;
            // Offset along normal, using a second deterministic noise
            const normalOffset = (noise1D(i + 1000) - 0.5) * 2 * normalStrength;
            x += nx * normalOffset;
            y += ny * normalOffset;
            const color = this.PARTICLE_COLORS[i % this.PARTICLE_COLORS.length];
            this.buffer[ptr++] = x;
            this.buffer[ptr++] = y;
            this.buffer[ptr++] = color[0];
            this.buffer[ptr++] = color[1];
            this.buffer[ptr++] = color[2];
        }
    }
}
