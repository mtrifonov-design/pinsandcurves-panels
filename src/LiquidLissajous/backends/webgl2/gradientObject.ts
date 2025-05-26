import { ParticleSystem } from "../../core/ParticleSystem";

const FLOATS_PER_PARTICLE = 5;          // x,y,r,g,b

// minimal FS quad – no per-instance attributes
const voroVS = `#version 300 es
in  vec2 a_pos;
in float particleCount;  // number of particles
out vec2 v_uv;
out float v_particleCount;
void main() {
  v_uv = a_pos;          // 0‥1
v_particleCount = particleCount;   // pass to FS    
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const voroFS = `#version 300 es
precision highp float;
uniform sampler2D u_dyn;
in  vec2 v_uv;
in  float v_particleCount; // number of particles
out vec4 outColor;

const int STRIDE  = ${FLOATS_PER_PARTICLE};

float fetch(int index) {             // helper to fetch RED float
  return texelFetch(u_dyn, ivec2(index, 0), 0).r;
}

void main() {
  vec3  col     = vec3(0.0);
  float best    = 1e20;
    int   PCOUNT  = int(v_particleCount); // number of particles

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


const MAX_PARTICLES = ParticleSystem.HARD_MAX;      // max number of particles
const texWidth = MAX_PARTICLES * FLOATS_PER_PARTICLE;


const gradientObject = {
    name: "voronoiBG",
    instanceAttributes: [{
        name: "particleCount",
        size: 1,
    }],
    vertexShader: voroVS,
    fragmentShader: voroFS,
    dynamicData: { width: texWidth, height: 1 },
}




function gradientDraw(particleSystem: ParticleSystem) {
    //console.log("gradientDraw called",particleSystem.buffer);
    const particles = particleSystem.PARTICLES.map(p => {
        return {
            ...p,
            x: p.x / particleSystem.WIDTH * 2 - 1, // map to -1..1
            y: p.y / particleSystem.HEIGHT * 2 - 1, // map to -1..1
        }
    })
    const P = particles.length;
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

    return {
        count: 1,
        attributes: {
            particleCount: new Float32Array([P]),  // number of particles
        },               // no per-instance data
        dynamicData: dynData,
    }

}

export { gradientDraw };

export default gradientObject;