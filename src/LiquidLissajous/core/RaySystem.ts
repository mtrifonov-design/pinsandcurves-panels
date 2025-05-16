import { randN, easeInExpo, easeInSine } from './math.js';
import { colorConvert, colorsLinear } from './colors.js';
import { PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { ControlsData } from '../LiquidLissajousControls.js';
type Project = PinsAndCurvesProjectController.Project;

export class RaySystem {
    // --- effect constants (unchanged from your prototype) ----------
    BURST_MAX   = 45;
    STRIPE_MAX  = 195;
    BURST_LIFE  = 40;
    STRIPE_LIFE = 70;
    TWO_PI      = Math.PI * 2;
    static HARD_MAX = 2000;
    RAY_COLORS = [
        [255,  0,  0],
        [  0,255,  0],
        [  0,  0,255],
    ]

    RAY_VARIANCE = 0.03; // 3% variance
    RAY_VARIANCE_VARIANCE = 0.03; // 3% variance
    BACKGROUND_COLOR = [0, 0, 0];
    BIRTH_RATE = 0.5;
    CENTER_X = 0.5;
    CENTER_Y = 0.5;
    WAVE_AMPLITUDE = 0;
    WAVE_FREQUENCY = 0;

    constructor() {
        this.buffer = new Float32Array(RaySystem.HARD_MAX * 14); // one vec3 per clr✕2 + misc
        this.count  = 0;
        this.time   = 0;
        this.burstPhase  = this.#initPhase(this.BURST_MAX , this.BURST_LIFE, 1);
        this.stripePhase = this.#initPhase(this.STRIPE_MAX, this.STRIPE_LIFE, 2);
    }

    wasBorn(birthFrame: number, threshold: number) {
        //console.log(this.time);
        if (!this.project) return false;
        //console.log(this.project);
        if (!Object.values(this.project.orgData.signalNames).includes("Birth Rate")) return false;
        const signalId = Object.entries(this.project.orgData.signalNames).find(([key, value]) => value === "Birth Rate")[0];
        //console.log(signalId);
        const [birthRate] = this.timeline.interpolateSignalValueAtTime(signalId, birthFrame);
        if (birthRate > threshold) return true;
        return false;
    }

    getCenter(birthFrame: number) {
        if (!this.project) return false;
        if (!Object.values(this.project.orgData.signalNames).includes("Center X")) return false;
        const cxsid = Object.entries(this.project.orgData.signalNames).find(([key, value]) => value === "Center X")[0];
        const [cx] = this.timeline.interpolateSignalValueAtTime(cxsid, birthFrame);
        const cysid = Object.entries(this.project.orgData.signalNames).find(([key, value]) => value === "Center Y")[0];
        const [cy] = this.timeline.interpolateSignalValueAtTime(cysid, birthFrame);
        return [cx, cy];
    }

    updateConstants() {
        ////console.log(this.controls);
        this.STRIPE_LIFE  = this.controls.lifespan;
        this.BURST_LIFE   = this.controls.lifespan;
        this.BURST_MAX    = Math.floor(this.controls.maxRays * 0.5);
        this.STRIPE_MAX   = Math.floor(this.controls.maxRays * 1);
        this.burstPhase  = this.#initPhase(this.BURST_MAX , this.BURST_LIFE, 1);
        this.stripePhase = this.#initPhase(this.STRIPE_MAX, this.STRIPE_LIFE, 2);
        this.RAY_VARIANCE = this.controls.averageThickness * 0.01;
        this.RAY_VARIANCE_VARIANCE = this.controls.thicknessVariance * 0.01;
        this.BACKGROUND_COLOR = this.controls.backgroundColor.map(c => c / 255);
        this.WAVE_AMPLITUDE = this.controls.waveAmplitude / 360;
        this.WAVE_FREQUENCY = this.controls.waveFrequency;

        const rayColors = [...this.controls.rayColors];

        const convertedRaycolors = (rayColors.map(c => {
            return [
                c[0] / 255,
                c[1] / 255,
                c[2] / 255
            ]
        }));

        this.RAY_COLORS = convertedRaycolors;

        if (!this.project) return false;
        if (!Object.values(this.project.orgData.signalNames).includes("Birth Rate")) return false;
        const cxsid = Object.entries(this.project.orgData.signalNames).find(([key, value]) => value === "Center X")[0];
        const [cx] = this.timeline.interpolateSignalValueAtTime(cxsid, this.time);
        const cysid = Object.entries(this.project.orgData.signalNames).find(([key, value]) => value === "Center Y")[0];
        const [cy] = this.timeline.interpolateSignalValueAtTime(cysid, this.time);
        this.CENTER_X = this.controls.centerX / 1920;
        this.CENTER_Y = this.controls.centerY / 1080;
    }

    /*--------------------------------------------------------------*/
    project: Project;
    controls: ControlsData;
    timeline: any;
    update(project: Project, controls: ControlsData, timeline: any) {
        this.time = project.timelineData.playheadPosition;
        this.project = project;
        this.controls = controls;
        this.timeline = timeline;
        this.updateConstants();
        const { BURST_MAX, STRIPE_MAX, BURST_LIFE, STRIPE_LIFE } = this;
        let ptr = 0;

        // ---------- Burst rays ------------------------------------
        for (let i = 0; i < BURST_MAX; ++i) {
            const rel = this.time - this.burstPhase[i];
            if (rel < 0) continue;
            const cycle = Math.floor(rel / BURST_LIFE);
            //console.log(cycle)
            const birthFrame = this.burstPhase[i] + cycle * BURST_LIFE;
            const wasBorn = this.wasBorn(birthFrame, i / BURST_MAX);
            if (!wasBorn) continue;
            const t   = (rel % BURST_LIFE) / BURST_LIFE;
            const p   = this.#burstParams(i);
            const dist= easeInExpo(t) * 2.5;
            const len = 0.01 + (p.maxLen - 0.01) * t;
            this.#write(ptr++, {
                angle:p.angle, variance:p.variance,
                start:dist, end:dist+len,
                softness:p.softness, colorRad:p.colorRad,
                fade:1,
                colors:this.RAY_COLORS[i % this.RAY_COLORS.length],
                center: this.getCenter(birthFrame)
            });
        }
        // ---------- Stripe rays -----------------------------------
        for (let i = 0; i < STRIPE_MAX; ++i) {
            const rel = this.time - this.burstPhase[i];
            if (rel < 0) continue;
            const cycle = Math.floor(rel / BURST_LIFE);
            //console.log(cycle)
            const birthFrame = this.burstPhase[i] + cycle * BURST_LIFE;
            const wasBorn = this.wasBorn(birthFrame, i / BURST_MAX);
            //console.log(wasBorn);
            if (!wasBorn) continue;
            const t  = (rel % STRIPE_LIFE) / STRIPE_LIFE;
            const p  = this.#stripeParams(i);
            const end= Math.min(easeInExpo(t*1.75),1) * 2.5;
            this.#write(ptr++, {
                angle:p.angle, variance:p.variance,
                start:0, end,
                softness:p.softness, colorRad:1,
                fade:1-easeInSine(t),
                colors:this.RAY_COLORS[i % this.RAY_COLORS.length],
                center: this.getCenter(birthFrame)

            });
        }
        this.count = ptr;               // # live rays this frame
    }

    /*--------------------------------------------------------------*/
    // The WebGPU backend expects one 48-byte record per ray:
    //  vec4 row0 = angle, variance, start, end
    //  vec4 row1 = softness, colorRad,  colA.r, colA.g
    //  vec4 row2 = colA.b,   colB.r,    colB.g, colB.b
    #write(index, p){
        // DEBUG ONLY
        // if (index === 0) {
        //     p.angle = 9 *Math.PI / 6;   // 30 degrees
        //     p.variance = 0.03;       // small width so the quad is obvious
        // }
        p.angle = p.angle - 2 * Math.PI

        const base = index * 14;
        const out  = this.buffer;
        out[base  ] = p.angle;   out[base+1] = p.variance;
        out[base+2] = p.start;   out[base+3] = p.end;
        out[base+4] = p.softness;out[base+5] = p.colorRad;
        out[base+6] = p.colors[0]*p.fade;
        out[base+7] = p.colors[1]*p.fade;
        out[base+8] = p.colors[2]*p.fade;
        out[base+9] = p.colors[0]*p.fade;
        out[base+10]= p.colors[1]*p.fade;
        out[base+11]= p.colors[2]*p.fade;
        out[base+12]= p.center ? p.center[0] : this.CENTER_X;
        out[base+13]= p.center ? p.center[1] : this.CENTER_Y;
    }

    /*--------------------------------------------------------------*/
    #initPhase(N,lifecycle,seed){
        const a = new Uint16Array(N);
        for (let i=0;i<N;++i) a[i] = Math.floor(randN(i+seed)*lifecycle);
        return a;
    }
    #burstParams(i){
        const k = 100 * i;
        return {
            maxLen  :1.8  * (0.9 + randN(k+1)*0.2),
            variance: Math.max(this.RAY_VARIANCE * 1.5 + (randN(k+2)* this.RAY_VARIANCE_VARIANCE - this.RAY_VARIANCE_VARIANCE / 2)* 1.5 ,0),
            softness:0.2  * (0.9 + randN(k+3)*0.2),
            colorRad:1.0  * (0.9 + randN(k+4)*0.2),
            angle   : randN(k+5) * this.TWO_PI
        };
    }
    #stripeParams(i){
        const k = 100 * i;
        return {
            variance: Math.max(this.RAY_VARIANCE + (randN(k+1)*this.RAY_VARIANCE_VARIANCE - this.RAY_VARIANCE_VARIANCE / 2),0),
            softness:0.1  * (0.9 + randN(k+2)*0.2),
            angle   :randN(k+3) * this.TWO_PI
        };
    }
}
