// @ts-nocheck
import { ParticleSystem } from '../../core/ParticleSystem.js';
import { SimpleWebGL2 } from '../../../SimpleWebGL2/index.js';

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

const particles = [
    { x: 0.25, y: 0.25, r: 1.0, g: 0.3, b: 0.2 },   // reddish
    { x: 0.75, y: 0.30, r: 0.2, g: 0.8, b: 0.2 },   // greenish
    { x: 0.50, y: 0.75, r: 0.2, g: 0.4, b: 1.0 },   // bluish
];
const P = particles.length;
const FLOATS_PER_PARTICLE = 5;          // x,y,r,g,b
const texWidth = P * FLOATS_PER_PARTICLE;

// pack x,y,r,g,b into a 1-row R32F texture
const dynData = new Float32Array(texWidth);
particles.forEach((p, i) => {
    const off = i * FLOATS_PER_PARTICLE;
    dynData[off + 0] = p.x;
    dynData[off + 1] = p.y;
    dynData[off + 2] = p.r;
    dynData[off + 3] = p.g;
    dynData[off + 4] = p.b;
});

// minimal FS quad – no per-instance attributes
const voroVS = `#version 300 es
in  vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;          // 0‥1
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const voroFS = `#version 300 es
precision highp float;
uniform sampler2D u_dyn;
in  vec2 v_uv;
out vec4 outColor;

const int PCOUNT  = ${P};
const int STRIDE  = ${FLOATS_PER_PARTICLE};

float fetch(int index) {             // helper to fetch RED float
  return texelFetch(u_dyn, ivec2(index, 0), 0).r;
}

void main() {
  vec3  col     = vec3(0.0);
  float best    = 1e20;

  for (int i = 0; i < PCOUNT; ++i) {
    int base = i * STRIDE;
    vec2 center = vec2(fetch(base), fetch(base + 1));
    float d = distance(v_uv, center);

    if (d < best) {
      best = d;
      col  = vec3(fetch(base + 2), fetch(base + 3), fetch(base + 4));
    }
  }
  outColor = vec4( col , 1.0 );
}`;

export class WebGL2Renderer {
    constructor(canvas, particleSystem) {
        this.canvas = canvas;
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

        SimpleWebGL2.__defineobject__({
            name: "voronoiBG",
            instanceAttributes: [],          // none – one instance is enough
            vertexShader: voroVS,
            fragmentShader: voroFS,
            dynamicData: { width: texWidth, height: 1 },
        });
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
        SimpleWebGL2.__drawobjectinstances__("voronoiBG", {
            count: 1,
            attributes: {},               // no per-instance data
            dynamicData: dynData,
        });
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
