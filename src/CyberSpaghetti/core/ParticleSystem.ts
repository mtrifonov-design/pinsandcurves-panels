// ParticleSystem for Liquid Lissajous
// Each particle: position (vec2), color (vec3)

import { TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import { Controls, ControlsData } from '../CyberSpaghettiControls.js';

// Deterministic pseudo-random number in [0, 1) from integer index
export function randFromIndex(index: number, seed = 0): number {
    let x = index ^ seed;
    x = (x ^ 61) ^ (x >>> 16);
    x = x + (x << 3);
    x = x ^ (x >>> 4);
    x = x * 0x27d4eb2d;
    x = x ^ (x >>> 15);
    // Convert to [0, 1)
    return ((x >>> 0) % 1000000) / 1000000;
}

function randomize(value: number, randomization: number, randIdx: number): number {
    return value + value * randomization * (2 * randFromIndex(randIdx) - 1);
}

function mix(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
}

export class ParticleSystem {
    time: number;
    CONFIG: ControlsData = Controls.defaultControls;
    rays: Array<any> = [];

    constructor() {
        this.time = 0;
    }

    update(config: ControlsData, timeline: TimelineController.TimelineController) {
        this.time = timeline.getProject().timelineData.playheadPosition;
        this.CONFIG = config;
        this.generateRays();
    }

    generateRays() {
        this.rays = [];
        const { numRays } = this.CONFIG;

        for (let i = 0; i < numRays; i++) {
            const offsetTime = this.time - Math.floor(randFromIndex(i) * this.CONFIG.rayLife);
            if (offsetTime < 0) continue; 
            const cycle = Math.floor(offsetTime/ this.CONFIG.rayLife) % (this.CONFIG.numCycles + 1);
            const rayTime = offsetTime - cycle * this.CONFIG.rayLife;
            if (rayTime < 0 || rayTime > this.CONFIG.rayLife) continue; // Skip if rayTime is out of bounds
            let rayRelTime = rayTime / this.CONFIG.rayLife;
            const rayLength = this.CONFIG.rayLength + this.CONFIG.rayLength * this.CONFIG.rayLengthRandomization * randFromIndex(i + 3) * 2 - this.CONFIG.rayLength * this.CONFIG.rayLengthRandomization; // Randomize ray length within the specified range
            rayRelTime = mix(rayRelTime, rayRelTime*rayRelTime*rayRelTime, this.CONFIG.perspectiveSkew);  
            
            const actualCycle =  Math.floor(offsetTime/ this.CONFIG.rayLife) % this.CONFIG.numCycles;
            const cycleIndex = actualCycle * this.CONFIG.numRays + i;
            const angleRel = randFromIndex(cycleIndex+1);
            const angle = (this.CONFIG.startAngle + (this.CONFIG.endAngle - this.CONFIG.startAngle) * angleRel) * (Math.PI / 180); // Convert to radians
            const center = [
                this.CONFIG.centerX * 2 - 1, // Convert to WebGL coordinates
                this.CONFIG.centerY * 2 - 1  // Convert to WebGL coordinates
            ];
            const centerX = center[0];
            const centerY = center[1];


            const innerRadiusIntersection = [
                centerX + this.CONFIG.innerRadius * Math.cos(angle),
                centerY + this.CONFIG.innerRadius * Math.sin(angle)
            ];
            const outerRadiusIntersection = [
                centerX + this.CONFIG.outerRadius * Math.cos(angle),
                centerY + this.CONFIG.outerRadius * Math.sin(angle)
            ];

            const innerOffset = this.CONFIG.innerRadiusRandomization * randFromIndex(cycleIndex + 5) * 0.5; // Randomize inner radius offset
            const outerOffset = 1 - this.CONFIG.outerRadiusRandomization * randFromIndex(cycleIndex + 6) * 0.5; // Randomize outer radius offset

            const perspectiveStrength = mix(1, rayRelTime, this.CONFIG.perspectiveSkew);
            const rayOffset = [
                mix(innerOffset,outerOffset,Math.min(Math.max(rayRelTime * (1+rayLength*perspectiveStrength) - rayLength*perspectiveStrength,0),1)),
                mix(innerOffset,outerOffset,Math.min(Math.max((rayRelTime) * (1+rayLength*perspectiveStrength),0),1)),
            ]


            const rayThickness = this.CONFIG.thickness 
            + this.CONFIG.thickness * this.CONFIG.thicknessRandomization * 2 * randFromIndex(cycleIndex + 4) - this.CONFIG.thickness * this.CONFIG.thicknessRandomization; // Randomize thickness within the specified range
            //console.log('rayOffset', rayOffset);
            const ray = {
                thickness: rayThickness,
                startPoint: innerRadiusIntersection,
                endPoint: outerRadiusIntersection,
                offset: rayOffset,
                color: this.CONFIG.rayColors[i % this.CONFIG.rayColors.length],
                phaseOffset: this.CONFIG.phaseRandomization * randFromIndex(cycleIndex +2 ),
            };
            //console.log('ray', ray.phaseOffset)
            this.rays.push(ray);

        }
    }
}
