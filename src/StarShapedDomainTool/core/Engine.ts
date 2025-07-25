
//import { rgb_to_oklab, gamma } from './oklab.js';
import { Controls, ControlsData } from '../StarShapedDomainControls.js';
//import { colorConvert, rgbToHsl, hslToRgb } from './colors.js';
import { TimelineController } from '@mtrifonov-design/pinsandcurves-external';

export class Engine {
    time: number;    
    REL_TIME: number = 0; // Relative time in the loop
    CONFIG: ControlsData = Controls.defaultControls; // Current configuration

    constructor() {
        this.time = 0;
    }

    update(config: ControlsData, timeline: TimelineController.TimelineController) {
        this.time = timeline.getProject().timelineData.playheadPosition;
        const loopLength = timeline.getProject().timelineData.focusRange[1];
        this.REL_TIME = (this.time % loopLength) / loopLength;
        this.CONFIG = config;
    }
}
