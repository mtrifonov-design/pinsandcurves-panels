import { ParticleSystem } from "../../core/ParticleSystem";
import { resolveLygia } from "./resolveLygia";

const FLOATS_PER_PARTICLE = 7;          

const voroVS = `#version 300 es
in  vec2 a_pos;
in float particleCount;  
in float width;         
in float height;        

in float slice;
out vec2 v_uv;
out float v_particleCount;
// out vec3 v_backgroundColor;
out float v_width;      
out float v_height;      

out float v_slice;

void main() {
    v_uv = a_pos;          
    v_particleCount = particleCount;   
    gl_Position = vec4(a_pos, 0.0, 1.0);
    v_width = width;      
    v_height = height;   
    v_slice = slice;      
}`;

const voroFS = resolveLygia(`#version 300 es
precision highp float;
uniform sampler2D u_dyn;
uniform sampler2D u_depth_field;
in  float v_width;        // width of the texture
in float v_height;       // height of the texture
in  vec2 v_uv;
in  float v_particleCount; // number of particles
out vec4 outColor;

in float v_slice;        
in float v_e_factor;     

const int STRIDE  = ${FLOATS_PER_PARTICLE};

float fetch(int index) {             // helper to fetch RED float
  return texelFetch(u_dyn, ivec2(index, 0), 0).r;
}
void main() {

    vec2 uv = v_uv;
    int PCOUNT = int(v_particleCount); // number of particles

    float sum = 0.0;
    float weightSum = 0.0;
    float sigma2 = 0.1; // controls the falloff distance
    float heightPower = 1. + 10.0; // controls the emphasis on height

    for (int i = 0; i < PCOUNT; ++i) {
        int base = i * STRIDE;
        vec3 point = vec3(fetch(base), fetch(base + 1), fetch(base + 2)); 
        vec2 delta = uv - point.xy;
        float r2 = dot(delta, delta);
        float w = exp(-r2 / sigma2);
        float z = (point.z  + 1.) / 2.;
        float h = pow(z, heightPower); 
        sum += w * h;
        weightSum += w;
    }
    float result = pow(sum / weightSum, 1.0 / heightPower);
    outColor = vec4(vec3(result),1.0);
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
    {
        name: "slice",
        size: 1,
    }
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