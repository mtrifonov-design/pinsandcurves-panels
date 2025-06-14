// ParticleSystem for Liquid Lissajous
// Each particle: position (vec2), color (vec3)

import { TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import { Controls, ControlsData } from '../CyberSpaghettiControls.js';

export class ParticleSystem {
    static HARD_MAX = 200;
    buffer: Float32Array;
    time: number;
    CONFIG: ControlsData = Controls.defaultControls;

    constructor() {
        this.buffer = new Float32Array(ParticleSystem.HARD_MAX * 5);
        this.time = 0;
    }

    update(config: ControlsData, timeline: TimelineController) {
        this.time = timeline.getProject().timelineData.playheadPosition;
        this.CONFIG = config;
    }
}
