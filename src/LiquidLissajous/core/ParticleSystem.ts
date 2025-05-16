// ParticleSystem for Liquid Lissajous
// Each particle: position (vec2), color (vec3)

import { TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import { Controls, ControlsData } from '../LiquidLissajousControls.js';
import { colorConvert } from './colors.js';

export class ParticleSystem {
    static HARD_MAX = 200;
    buffer: Float32Array;
    time: number;
    CENTER_X: number = 0.5;
    CENTER_Y: number = 0.5;
    BACKGROUND_COLOR: number[] = [0, 0, 0];
    PARTICLE_RADIUS: number = 300;
    PARTICLE_SPEED: number = 0.05;
    PARTICLE_COLORS: number[][] = [[1,0,0],[0,1,0],[0,0,1]];
    PARTICLE_COUNT: number = 3;

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
        this.PARTICLE_COUNT = config.particleCount;

        // Default Lissajous parameters for a classic figure
        const lissajousParams = {
            ax: 3, bx: 0, ay: 2, by: 0, // frequencies
            deltaX: 0, deltaY: Math.PI / 2, // phase offsets
            centerX: this.CENTER_X * 1920,
            centerY: this.CENTER_Y * 1080,
            scaleX: this.PARTICLE_RADIUS,
            scaleY: this.PARTICLE_RADIUS
        };

        let ptr = 0;
        for (let i = 0; i < this.PARTICLE_COUNT; ++i) {
            // Distribute particles along the curve
            const t = this.PARTICLE_SPEED * this.time + (i * 2 * Math.PI / this.PARTICLE_COUNT);
            const [x, y] = this.lissajousXY(t, lissajousParams);
            const color = this.PARTICLE_COLORS[i % this.PARTICLE_COLORS.length];
            this.buffer[ptr++] = x;
            this.buffer[ptr++] = y;
            this.buffer[ptr++] = color[0];
            this.buffer[ptr++] = color[1];
            this.buffer[ptr++] = color[2];
        }
    }
}
