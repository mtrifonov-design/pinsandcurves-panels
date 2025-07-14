import { ParticleSystem } from "../../core/ParticleSystem";
import { resolveLygia } from "./resolveLygia";

const FLOATS_PER_PARTICLE = 7;          // x,y,z,r,g,b,a

// minimal FS quad – no per-instance attributes
const voroVS = `#version 300 es
in  vec2 a_pos;
in float particleCount;  // number of particles
in float width;         // width of the texture
in float height;        // height of the texture
// in float time;
// in vec3 backgroundColor;

// in float slice;
// in float e_factor;

// in vec3 noise;
// in vec3 fluidWarp;
// out vec3 v_noise;
// out vec3 v_fluidWarp;
out vec2 v_uv;
out float v_particleCount;
// out vec3 v_backgroundColor; // pass to FS
out float v_width;       // pass to FS
out float v_height;      // pass to FS
// out float v_time;

// out float v_slice;
// out float v_e_factor;

void main() {
  v_uv = a_pos;          // 0‥1
v_particleCount = particleCount;   // pass to FS    
  gl_Position = vec4(a_pos, 0.0, 1.0);
    v_width = width;      // pass to FS
    v_height = height;    // pass to FS
    // v_noise = noise;
    // v_fluidWarp = fluidWarp;

    // v_time = time;
    // v_backgroundColor = backgroundColor; // pass to FS

    // v_slice = slice;      
    // v_e_factor = e_factor; 
}`;

const voroFS = resolveLygia(`#version 300 es
precision highp float;
uniform sampler2D u_dyn;
uniform sampler2D u_depth_field;
in  float v_width;        // width of the texture
in float v_height;       // height of the texture
// in  float v_time;         // time, not used
in  vec2 v_uv;
// in vec3 v_backgroundColor; // background color
// in vec3 v_noise;
// in vec3 v_fluidWarp;
in  float v_particleCount; // number of particles
out vec4 outColor;

in float v_slice;        
in float v_e_factor;     

// #include "lygia/generative/psrdnoise.glsl"
// #include "lygia/generative/pnoise.glsl"
//#include "lygia/filter/gaussianBlur/2D.glsl"

const int STRIDE  = ${FLOATS_PER_PARTICLE};

float fetch(int index) {             // helper to fetch RED float
  return texelFetch(u_dyn, ivec2(index, 0), 0).r;
}


float fallof(float distance) {
    // prev 5.
    return 1.0 / (1.0 + exp(3.5 * distance - 3.5));

}

vec4 getColor(vec2 p) {
    float d = 0.0;
    int PCOUNT = int(v_particleCount); // number of particles

    for (int i = 0; i < PCOUNT; ++i) {
        int base = i * STRIDE;
        vec2 center = vec2(fetch(base), fetch(base + 1)); 
        float height = (fetch(base + 2) + 1.) / 2.; 

        float distance = length(p - center);
        float a = 10.;
        //float dLocal = height * 1. / (sqrt(1. + (distance * a) * (distance * a)));
        float dLocal = height * fallof(distance); // Gaussian falloff
        if (dLocal > d) {
            d = dLocal;
        }
    }

    return vec4(vec3(d), 1.); 
}

void main() {

    vec2 uv = v_uv;
    int PCOUNT = int(v_particleCount); // number of particles

    vec4 col = getColor(uv);
    outColor = col;
}`);


const MAX_PARTICLES = ParticleSystem.HARD_MAX;      // max number of particles
const texWidth = MAX_PARTICLES * FLOATS_PER_PARTICLE;


const depthObject = {
    name: "depthObj",
    instanceAttributes: [{
        name: "particleCount",
        size: 1,
    },
    {
        name: "width",
        size: 1,
    },
    {
        name: "height",
        size: 1,
    },
    ],
    vertexShader: voroVS,
    fragmentShader: voroFS,
    dynamicData: { width: texWidth, height: 1 },

}




function depthDraw(particleSystem: ParticleSystem) {
    // Store particle positions in normalized [0,1] coordinates
    const particles = particleSystem.PARTICLES;
    const P = particles.length;
    // pack x,y,r,g,b into a 1-row R32F texture
    const dynData = new Float32Array(texWidth);

    particles.forEach((p, i) => {
        const off = i * FLOATS_PER_PARTICLE;
        dynData[off + 0] = p.x;
        dynData[off + 1] = p.y;
        dynData[off + 2] = p.z; // red
        dynData[off + 3] = p.r;
        dynData[off + 4] = p.g;
        dynData[off + 5] = p.b;
        dynData[off + 6] = p.aWeight; 
    });

    const backgroundColorArr = new Float32Array([particleSystem.BACKGROUND_COLOR[0], 
        particleSystem.BACKGROUND_COLOR[1], particleSystem.BACKGROUND_COLOR[2]]);
    const widthArr = new Float32Array([particleSystem.WIDTH]);
    const heightArr = new Float32Array([particleSystem.HEIGHT]);
    const timeArr = new Float32Array([particleSystem.REL_TIME]);
    const noiseIntensityArr = new Float32Array([particleSystem.CONFIG.noiseIntensity, particleSystem.CONFIG.noiseScale, particleSystem.CONFIG.noiseSpeed]);
    const warpIntensityArr = new Float32Array([particleSystem.CONFIG.fluidWarpIntensity,particleSystem.CONFIG.fluidWarpScale, particleSystem.CONFIG.fluidWarpSpeed]);


    return {
        count: 1,
        attributes: {
            particleCount: new Float32Array([P]),  // number of particles
            width: widthArr,                       // width of the texture
            height: heightArr,                     // height of the texture
            time: timeArr,                         // current time
            noise: noiseIntensityArr,    // noise intensity
            fluidWarp: warpIntensityArr,      // warp intensity
            slice: new Float32Array([particleSystem.CONFIG.mixingIntensity]), // current slice
            e_factor: new Float32Array([1]), // e factor for
            backgroundColor: backgroundColorArr, // background color
        },               // no per-instance data
        dynamicData: dynData,
    }
}

export { depthDraw };

export default depthObject;