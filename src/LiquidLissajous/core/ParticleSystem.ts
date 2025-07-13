// ParticleSystem for Liquid Lissajous
// Each particle: position (vec2), color (vec3)
import { rgb_to_oklab } from './oklab.js';

import { TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import { Controls, ControlsData } from '../LiquidLissajousControls.js';
import { colorConvert, rgbToHsl, hslToRgb } from './colors.js';
import { matrix, ones, inv, multiply } from 'mathjs';


function rbf(v1: number[], v2: number[],e): number {
    // Radial basis function for distance
    const r = Math.sqrt(v1.reduce((sum, val, i) => sum + (val - v2[i]) ** 2, 0));
    //const e = 5;
    return 1 / Math.sqrt(1 + (r*e) ** 2);
}

function rbfSharp(v1: number[], v2: number[]): number {
    // Radial basis function for distance
    const r = Math.sqrt(v1.reduce((sum, val, i) => sum + (val - v2[i]) ** 2, 0));
    const e = .5;
    return Math.exp(-((r * e)**2));
}

export class ParticleSystem {
    static HARD_MAX = 200;
    time: number;
    CENTER_X: number = 0.5;
    CENTER_Y: number = 0.5;
    BACKGROUND_COLOR: number[] = [0, 0, 0];
    PARTICLE_RADIUS: number = 300;
    PARTICLE_SPEED: number = 0.01;
    PARTICLE_COLORS: number[][] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    PARTICLE_COUNT: number = 3;
    LOOP_LIFECYCLE: number = 60;
    SHOW_LISSAJOUS_FIGURE: boolean = false;
    RATIO_A: number = 1;
    RATIO_B: number = 1;
    OFFSET: number = Math.PI / 2;
    lissajousLineBuffer: Float32Array = new Float32Array(1024 * 2); // up to 1024 points
    lissajousLineCount: number = 0;
    WIDTH: number = 1920;
    HEIGHT: number = 1080;
    FIGURE_SCALE_X: number = 0.5;
    FIGURE_SCALE_Y: number = 0.5;
    PARTICLES: any[] = []; // Placeholder for particles, if needed
    LISSAJOUS_PATH: [number, number][] = []; // Placeholder for Lissajous path points
    REL_TIME: number = 0; // Relative time in the loop
    CONFIG: ControlsData = Controls.defaultControls; // Current configuration

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

    lissajousKnot(t: number, params: {
        a: number, a_delta: number,
        b: number, b_delta: number,
        c: number,
    }) {
        const x = Math.cos(params.a * t + params.a_delta);
        const y = Math.cos(params.b * t + params.b_delta);
        const z = Math.cos(params.c * t);
        return [x, y, z]
    }

    constructColorWeights() {
        const particleLength = this.PARTICLES.length;
        const m = matrix(ones(particleLength,particleLength));
        const mSharp = matrix(ones(particleLength,particleLength));
        for (let i = 0; i < particleLength; ++i) {
            for (let j = 0; j < particleLength; ++j) {
                const v1 = this.PARTICLES[i];
                const v2 = this.PARTICLES[j];
                const e = 1.;
                const eSharp= 100;
                m.set([i, j], rbf([v1.x, v1.y, v1.z], [v2.x, v2.y, v2.z], e));
                mSharp.set([i, j], rbfSharp([v1.x, v1.y, v1.z], [v2.x, v2.y, v2.z]));
            }
        }        
        //console.log("Constructed matrix m", m);
        const inverse = inv(m);
        const inverseSharp = inv(mSharp);
        const rVector = matrix(ones(particleLength, 1));
        const gVector = matrix(ones(particleLength, 1));
        const bVector = matrix(ones(particleLength, 1));
        const aVector = matrix(ones(particleLength, 1));
        for (let i = 0; i < particleLength; ++i) {
            const v = this.PARTICLES[i];
            // to oklab
            const { L , a, b}  = rgb_to_oklab({
                r: v.r * 255,
                g: v.g * 255,
                b: v.b * 255
            });

            const [ Lbg, abg, bbg ] = this.BACKGROUND_COLOR;

            rVector.set([i, 0], L - Lbg);
            gVector.set([i, 0], a - abg);
            bVector.set([i, 0], b - bbg);
            aVector.set([i,0], 1);
        }
        const rWeights = multiply(inverse, rVector);
        const gWeights = multiply(inverse, gVector);
        const bWeights = multiply(inverse, bVector);
        const aWeights = multiply(inverseSharp, aVector);
        const colorMatrix = matrix(ones(particleLength, 4));
        for (let i = 0; i < particleLength; ++i) {
            colorMatrix.set([i, 0], rWeights.get([i, 0]));
            colorMatrix.set([i, 1], gWeights.get([i, 0]));
            colorMatrix.set([i, 2], bWeights.get([i, 0]));
            colorMatrix.set([i, 3], aWeights.get([i, 0])); // Alpha not used
        }

        return colorMatrix;
    }

    update(config: ControlsData, timeline: TimelineController) {
        this.time = timeline.getProject().timelineData.playheadPosition;

        const baseColors = config.particleColors.map(colorConvert);
        const subdivisions = 0 // Math.floor(config.mixingIntensity * 5);
        let colorLoopCount = 0;
        if (baseColors.length > 1) {
            colorLoopCount = baseColors.length * (subdivisions + 1);
            this.PARTICLE_COUNT = colorLoopCount;
        } else {
            this.PARTICLE_COUNT = baseColors.length;
        }

        this.LOOP_LIFECYCLE = config.loopLifecycle;
        this.WIDTH = config.width;
        this.HEIGHT = config.height;
        this.RATIO_A = config.ratioA;
        this.RATIO_B = config.ratioB;
        this.OFFSET = config.offset;
        this.SHOW_LISSAJOUS_FIGURE = config.showLissajousFigure;
        this.FIGURE_SCALE_X = config.figureScaleX;
        this.FIGURE_SCALE_Y = config.figureScaleY;
        this.REL_TIME = (this.time % this.LOOP_LIFECYCLE) / this.LOOP_LIFECYCLE;
        this.CONFIG = config;
        const colorStops: number[][] = [];
        if (baseColors.length > 1) {
            for (let i = 0; i < baseColors.length; ++i) {
                const c0 = rgbToHsl(baseColors[i]);
                const c1 = rgbToHsl(baseColors[(i + 1) % baseColors.length]);
                for (let s = 0; s < subdivisions + 1; ++s) {
                    const frac = s / (subdivisions + 1);
                    // Interpolate hue circularly
                    let dh = c1[0] - c0[0];
                    if (Math.abs(dh) > 0.5) dh -= Math.sign(dh);
                    const h = (c0[0] + dh * frac + 1) % 1;
                    const s_ = c0[1] + (c1[1] - c0[1]) * frac;
                    const l = c0[2] + (c1[2] - c0[2]) * frac;
                    colorStops.push(hslToRgb([h, s_, l]));
                }
            }
        } else if (baseColors.length === 1) {
            colorStops.push(baseColors[0]);
        }
        this.PARTICLE_COLORS = colorStops;

        // Default Lissajous parameters for a classic figure
        const lissajousParams = {
            t: this.REL_TIME * 2 * Math.PI,
            a: config.ratioA, a_delta: config.offset,
            b: config.ratioB, b_delta: 0.7,
            c: 1
        };

        this.PARTICLES = [];
        for (let i = 0; i < this.PARTICLE_COUNT; ++i) {
            let t = (this.time % this.LOOP_LIFECYCLE) * 2 * Math.PI / this.LOOP_LIFECYCLE
            t += (i / this.PARTICLE_COUNT) * 2 * Math.PI;
            let [x, y, z] = this.lissajousKnot(t, lissajousParams);
            x *= this.FIGURE_SCALE_X * 2;
            y *= this.FIGURE_SCALE_Y * 2;
            z *= 1;
             //console.log(`Particle ${i}: x=${x}, y=${y}, z=${z}`);
            const color = this.PARTICLE_COLORS[i];
            //const { L, a, b } = rgbToOklab({ r: color[0] * 255, g: color[1] * 255, b: color[2] * 255 });
            this.PARTICLES[i] = {
                x, y , z, 
                r: color[0],
                g: color[1], 
                b: color[2],
            }; 
        }

                const bgcolor = rgb_to_oklab({
            r: config.backgroundColor[0],
            g: config.backgroundColor[1],
            b: config.backgroundColor[2]
        });
        this.BACKGROUND_COLOR = [bgcolor.L, bgcolor.a, bgcolor.b];
        console.log("Background color in Oklab:", this.BACKGROUND_COLOR);
       

        const colorWeights = this.constructColorWeights();
        for (let i = 0; i < this.PARTICLE_COUNT; ++i) {
            this.PARTICLES[i].rWeight = colorWeights.get([i, 0]);
            this.PARTICLES[i].gWeight = colorWeights.get([i, 1]);
            this.PARTICLES[i].bWeight = colorWeights.get([i, 2]);
            this.PARTICLES[i].aWeight = colorWeights.get([i, 3]); 
        }


        // Generate Lissajous polyline for overlay
        const N = 256; // number of points in the polyline
        this.lissajousLineCount = N;
        this.LISSAJOUS_PATH = [];
        for (let i = 0; i < N; ++i) {
            const t = (i / (N - 1)) * 2 * Math.PI;
            let [x, y] = this.lissajousKnot(t, lissajousParams);
            x *= this.FIGURE_SCALE_X * 2;
            y *= this.FIGURE_SCALE_Y * 2;
            this.lissajousLineBuffer[i * 2 + 0] = x;
            this.lissajousLineBuffer[i * 2 + 1] = y;
            this.LISSAJOUS_PATH[i] = [x, y]; // Store path points if needed
        }
    }
}
