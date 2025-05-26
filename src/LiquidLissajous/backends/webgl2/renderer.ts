// @ts-nocheck
import { ParticleSystem } from '../../core/ParticleSystem.js';
import { SimpleWebGL2 } from '../../../SimpleWebGL2/index.js';
import gradientObject, { gradientDraw } from './gradientObject.js';

const circleVS = `#version 300 es
in  vec2 a_pos;          // quad corner (-1..1)
in  vec2 offset;         // instance centre in clip-space
in  float radius;        // instance radius (clip-space)
in  vec3 fillColor;      // per-instance RGB
out vec2 v_local;        // coord inside quad (-1..1)
out vec3 v_color;
void main() {
  v_local = a_pos;
  v_color = fillColor;
  gl_Position = vec4(a_pos * radius + offset, 0.0, 1.0);
}`;

const circleFS = `#version 300 es
precision highp float;
in  vec2 v_local;
in  vec3 v_color;
out vec4 outColor;
void main() {
  if (length(v_local) > 1.0) discard;  // keep circular footprint
  outColor = vec4(v_color, 1.0);
}`;



export class WebGL2Renderer {
    constructor(canvas, particleSystem) {
        this.canvas = canvas;
        this.particleSys = particleSystem;
        SimpleWebGL2.__init__(canvas);
        SimpleWebGL2.__defineobject__({
            name: "circle",
            instanceAttributes: [
                { name: "offset", size: 2 },
                { name: "radius", size: 1 },
                { name: "fillColor", size: 3 },
            ],
            vertexShader: circleVS,
            fragmentShader: circleFS,
        });

        SimpleWebGL2.__defineobject__(gradientObject);
        SimpleWebGL2.__end__init__();
    }

    async init() {
        return;
    }

    async onFrameReady(cb) {
        return
    }

    draw() {
        SimpleWebGL2.__begin__();
        SimpleWebGL2.__drawobjectinstances__("voronoiBG", gradientDraw(this.particleSys));
        SimpleWebGL2.__drawobjectinstances__("circle", {
            count: 2,
            attributes: {
                /* instance 0 then 1 … */
                offset: new Float32Array([-0.5, 0.0, 0.5, 0.0]),  // centers
                radius: new Float32Array([0.3, 0.3]),               // sizes
                fillColor: new Float32Array([0.0, 0.0, 1.0, 1.0, 0.0, 0.0]), // blue, red
            },
        });


        SimpleWebGL2.__end__();

    }

}
