// @ts-nocheck
import { ParticleSystem } from '../../core/ParticleSystem.js';
import { SimpleWebGL2 } from '../../../SimpleWebGL2/index.js';
import circleObject, { circleDraw } from './circleObject.js';
import backgroundObject, { backgroundDraw } from './backgroundObject.js';


export class WebGL2Renderer {
    constructor(canvas, particleSystem) {
        this.canvas = canvas;
        this.particleSys = particleSystem;
        SimpleWebGL2.__init__(canvas);
        SimpleWebGL2.__defineobject__(circleObject);
        SimpleWebGL2.__defineobject__(backgroundObject);
        SimpleWebGL2.__end__init__();
    }

    async init() {
        return;
    }

    async onFrameReady(cb) {
        return cb();
    }

    draw() {
        SimpleWebGL2.__begin__();
        SimpleWebGL2.__drawobjectinstances__("background", backgroundDraw(this.particleSys));
        SimpleWebGL2.__drawobjectinstances__("circle", circleDraw(this.particleSys));
        // SimpleWebGL2.__drawobjectinstances__("voronoiBG", gradientDraw(this.particleSys));
        // if (this.particleSys.SHOW_LISSAJOUS_FIGURE) {
        //     SimpleWebGL2.__drawobjectinstances__("path", pathDraw(this.particleSys));
        //     SimpleWebGL2.__drawobjectinstances__("circle",circleDraw(this.particleSys));
        // }
        SimpleWebGL2.__end__();

    }

}
