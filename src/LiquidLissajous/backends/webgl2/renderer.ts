// @ts-nocheck
import { ParticleSystem } from '../../core/ParticleSystem.js';
import { SimpleWebGL2 } from '../../../SimpleWebGL2/index.js';
import gradientObject, { gradientDraw } from './gradientObject.js';
import circleObject, { circleDraw } from './circleObject.js';
import pathObject, { pathDraw } from './pathObject.js';

function makeTileableNoise(size = 64, float = false) {
  const N = size * size;
  if (float) {
    const d = new Float32Array(N);
    for (let i=0;i<N;++i) d[i] = Math.random();
    return d;
  } else {
    const d = new Uint8Array(N);
    crypto.getRandomValues(d);          // fast & good entropy
    return d;
  }
}


export class WebGL2Renderer {
    constructor(canvas, particleSystem) {
        this.canvas = canvas;
        this.particleSys = particleSystem;
        SimpleWebGL2.__init__(canvas);
        SimpleWebGL2.__defineobject__(circleObject);
        SimpleWebGL2.__defineobject__(pathObject);
        SimpleWebGL2.__defineobject__(gradientObject);
        SimpleWebGL2.__createtexture__({
            name: "noiseTex",
            width: 256,
            height: 256,
            wrap: "repeat",
            filter: "linear",
            initial: makeTileableNoise(256),
        })
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
        SimpleWebGL2.__drawobjectinstances__("voronoiBG", gradientDraw(this.particleSys));
        if (this.particleSys.SHOW_LISSAJOUS_FIGURE) {
            SimpleWebGL2.__drawobjectinstances__("path", pathDraw(this.particleSys));
            SimpleWebGL2.__drawobjectinstances__("circle",circleDraw(this.particleSys));
        }
        SimpleWebGL2.__end__();

    }

}
