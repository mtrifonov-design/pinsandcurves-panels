
//import { rgb_to_oklab, gamma } from './oklab.js';
import { Controls, ControlsData } from '../StarShapedDomainControls.js';
//import { colorConvert, rgbToHsl, hslToRgb } from './colors.js';
import { TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import { ImageController } from '../StarShapedDomainInterior.js';


export class Engine {
    time: number;    
    REL_TIME: number = 0; // Relative time in the loop
    CONFIG: ControlsData = Controls.defaultControls; // Current configuration
    currentImageAssetId: string = '';
    image: HTMLImageElement | null = null;

    constructor() {
        this.time = 0;
    }

    async init() {
        const image = new Image();
        image.src = "/pinsandcurves-panels/shape.jpg";
        return new Promise((resolve) => {
            image.onload = () => {
                this.image = image;
                resolve(true);
            };
        });
    }

    update(config: ControlsData, 
        timeline: TimelineController.TimelineController, assets: ImageController[]) {
        this.time = timeline.getProject().timelineData.playheadPosition;
        const loopLength = timeline.getProject().timelineData.focusRange[1];
        this.REL_TIME = (this.time % loopLength) / loopLength;
        this.CONFIG = config;

        if (this.CONFIG.shapeImageAssetId !== this.currentImageAssetId
            && assets.find(a => a.assetId === this.CONFIG.shapeImageAssetId) !== undefined
        ) {
            this.currentImageAssetId = this.CONFIG.shapeImageAssetId;
            const asset = assets.find(a => a.assetId === this.currentImageAssetId);
            if (asset) {
                const image = new Image();
                image.src = asset.assetController.getSnapshot();
                image.onload = () => {
                    this.image = image;
                }
            } else {
                this.image = null;
            }
        }
    }
}
