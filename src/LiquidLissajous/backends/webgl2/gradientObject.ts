import { ParticleSystem } from "../../core/ParticleSystem";
import { resolveLygia } from "./resolveLygia";

const FLOATS_PER_PARTICLE = 7;          // x,y,z,r,g,b,a

// minimal FS quad – no per-instance attributes
const voroVS = `#version 300 es
in  vec2 a_pos;
in float particleCount;  // number of particles
in float width;         // width of the texture
in float height;        // height of the texture
in float time;
in vec3 backgroundColor;

in float slice;
in float e_factor;

in vec3 noise;
in vec3 fluidWarp;
out vec3 v_noise;
out vec3 v_fluidWarp;
out vec2 v_uv;
out float v_particleCount;
out vec3 v_backgroundColor; // pass to FS
out float v_width;       // pass to FS
out float v_height;      // pass to FS
out float v_time;

out float v_slice;
out float v_e_factor;

void main() {
  v_uv = a_pos;          // 0‥1
v_particleCount = particleCount;   // pass to FS    
  gl_Position = vec4(a_pos, 0.0, 1.0);
    v_width = width;      // pass to FS
    v_height = height;    // pass to FS
    v_noise = noise;
    v_fluidWarp = fluidWarp;

    v_time = time;
    v_backgroundColor = backgroundColor; // pass to FS

    v_slice = slice;      
    v_e_factor = e_factor; 
}`;

const voroFS = resolveLygia(`#version 300 es
precision highp float;
uniform sampler2D u_dyn;
uniform sampler2D u_depth_field;
in  float v_width;        // width of the texture
in float v_height;       // height of the texture
in  float v_time;         // time, not used
in  vec2 v_uv;
in vec3 v_backgroundColor; // background color
in vec3 v_noise;
in vec3 v_fluidWarp;
in  float v_particleCount; // number of particles
out vec4 outColor;

in float v_slice;        
in float v_e_factor;     

// #include "lygia/generative/psrdnoise.glsl"
// #include "lygia/generative/pnoise.glsl"
#include "lygia/color/space/oklab2rgb.glsl"

const int STRIDE  = ${FLOATS_PER_PARTICLE};

float fetch(int index) {             // helper to fetch RED float
  return texelFetch(u_dyn, ivec2(index, 0), 0).r;
}

// // Helper for squared distance (cheaper than length)
// float distanceSquared(vec2 a, vec2 b) {
//     a = a + vec2(1.);
//     b = b + vec2(1.);
//     a = a * vec2(0.5); // * vec2(v_width, v_height); 
//     b = b * vec2(0.5); // * vec2(v_width, v_height); 
//     vec2 d = a - b;
//     return dot(d, d);
// }

// // --- sRGB <-> OKLab conversion functions (from WGSL, ported to GLSL) ---
// vec3 toLinear(vec3 c) {
//     return pow(c, vec3(2.2));
// }
// vec3 toSRGB(vec3 c) {
//     return pow(clamp(c, vec3(0.0), vec3(1.0)), vec3(1.0 / 2.2));
// }
// vec3 srgbToOKLab(vec3 c) {
//     vec3 l = toLinear(c);
//     vec3 lms = vec3(
//         0.4122214708 * l.x + 0.5363325363 * l.y + 0.0514459929 * l.z,
//         0.2119034982 * l.x + 0.6806995451 * l.y + 0.1073969566 * l.z,
//         0.0883024619 * l.x + 0.2817188376 * l.y + 0.6299787005 * l.z
//     );
//     vec3 cbrt = pow(lms, vec3(1.0 / 3.0));
//     return vec3(
//         0.2104542553 * cbrt.x + 0.7936177850 * cbrt.y - 0.0040720468 * cbrt.z,
//         1.9779984951 * cbrt.x - 2.4285922050 * cbrt.y + 0.4505937099 * cbrt.z,
//         0.0259040371 * cbrt.x + 0.7827717662 * cbrt.y - 0.8086757660 * cbrt.z
//     );
// }
// vec3 oklabToSRGB(vec3 o) {
//     float l_ = o.x + 0.3963377774 * o.y + 0.2158037573 * o.z;
//     float m_ = o.x - 0.1055613458 * o.y - 0.0638541728 * o.z;
//     float s_ = o.x - 0.0894841775 * o.y - 1.2914855480 * o.z;
//     float l3 = l_ * l_ * l_;
//     float m3 = m_ * m_ * m_;
//     float s3 = s_ * s_ * s_;
//     vec3 rgb = vec3(
//         4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
//        -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
//        -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3
//     );
//     return toSRGB(rgb);
// }

float rbf(vec3 p, vec3 q, float e) {
    float d = sqrt(dot(p - q, p - q));
    //return exp( -(d*e) * (d*e) );
    //return sqrt(1. + (d*e) * (d*e));
    return 1. / sqrt(1. + (d*e) * (d*e));
   // return 0.05 / (d * d + 0.05);
}

float rbfSharp(vec3 p, vec3 q, float e) {
    float d = sqrt(dot(p - q, p - q));
    return exp( -(d*e) * (d*e) );
    //return sqrt(1. + (d*e) * (d*e));
    //return 1. / sqrt(1. + (d*e) * (d*e));
   // return 0.05 / (d * d + 0.05);
}


vec4 getColor(vec3 p) {
    float r = 0.0;
    float g = 0.0;
    float b = 0.0;
    float a = 0.0;
    int PCOUNT = int(v_particleCount); // number of particles
    for (int i = 0; i < PCOUNT; ++i) {
        int base = i * STRIDE;
        vec3 center = vec3(fetch(base), fetch(base + 1), fetch(base+2)); // [0,1] normalized

        float rW = fetch(base + 3); // red weight
        float gW = fetch(base + 4); // green weight
        float bW = fetch(base + 5); // blue weight
        float aW = fetch(base + 6); // alpha weight, not used

        float e = 1.;
        float eSharp = 100.;
        r += rW * rbf(p, center, e);
        g += gW * rbf(p, center, e);
        b += bW * rbf(p, center, e);
        a += aW * rbfSharp(p, center, .5);
    }

    float minDistance = 0.;
    vec3 minDistanceColor = vec3(0.0);


    float wTotal = 0.0;
    float u_r = 0.0;
    float u_g = 0.0;
    float u_b = 0.0;

    bool needsNormalization = true;
    for (int i = 0; i < PCOUNT; ++i) {


        int base = i * STRIDE;
        vec3 center = vec3(fetch(base), fetch(base + 1), fetch(base+2));
        float distance = sqrt(dot(p - center, p - center));
        if (i == 0 || distance < minDistance) {
            minDistance = distance;
            minDistanceColor = vec3(fetch(base + 3), fetch(base + 4), fetch(base + 5));
        }

        if (distance < 0.01) {
            u_r = fetch(base + 3);
            u_g = fetch(base + 4);
            u_b = fetch(base + 5);
            needsNormalization = false; 
            break;
        } else {
            float w = 1. / pow(distance, 3.);
            wTotal += w;
            u_r += fetch(base + 3) * w;
            u_g += fetch(base + 4) * w;
            u_b += fetch(base + 5) * w;
        }
    }
    
    if (needsNormalization && wTotal > 0.0) {
        u_r /= wTotal;
        u_g /= wTotal;
        u_b /= wTotal;
    }


    vec3 okLabColor = vec3(r, g, b);
    //return vec4(okLabColor, a); 
    //return vec4(r,g,b,a);
    //return vec4(minDistanceColor, a); // return color of the closest particle
    return vec4(u_r, u_g, u_b, a); // return average color weighted by distance
}

void main() {

    vec2 uv = v_uv;
    int PCOUNT = int(v_particleCount); // number of particles

    float depthField = texture(u_depth_field, v_uv).r;
    vec3 bgColor = v_backgroundColor; // background color

    vec4 accColor = vec4(bgColor,1.);
    int ITERATIONS = 16;
    float stepSize = (1.0 / float(ITERATIONS)) * 2.;
    float transmittance = 1.;
    float sigma = 1.1;

    for (int i = 0; i < ITERATIONS && transmittance > 0.01; ++i) {
        float depth = (float(i)+ 0.5) * stepSize;
        vec3 p = vec3(uv, 1. - depth);
        vec4 col = getColor(p);
        float alpha = col.a;

        float density = alpha * .5;
        float segmentAlpha = 1. - exp(-sigma * density * stepSize);

        vec3 colorContribution = col.rgb * segmentAlpha * transmittance;
        accColor.rgb += colorContribution;

        accColor.a += segmentAlpha * transmittance;

        transmittance *= (1.0 - segmentAlpha);

    }

    // alpha blend outcolor on top of background color
    
    //outColor = vec4(bgColor, 1.0);
    //outColor = (1.0 - accColor.a / 2.) * outColor + accColor;
    outColor = accColor;
    //outColor = oklab2rgb(outColor);

    //outColor = vec4(accColor.xyz, 1.0); 
    //outColor = vec4(accColor.xyz / stepsTaken, 1.);

    //outColor = vec4(vec3(getColor(vec3(uv, v_slice * 2. - 1.)).a), 1.);
    //outColor = vec4(getColor(vec3(uv, v_slice * 2. - 1.)).rgb, 1.);
    outColor = vec4(vec3(depthField), 1.0); 

}`);

console.log(voroFS);


const MAX_PARTICLES = ParticleSystem.HARD_MAX;      // max number of particles
const texWidth = MAX_PARTICLES * FLOATS_PER_PARTICLE;


const gradientObject = {
    name: "voronoiBG",
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
        name: "time",
        size: 1,
    },
    {
        name: "noise",
        size: 3,
    },
    {
        name: "fluidWarp",
        size: 3,
    },
    {
        name: "slice",
        size: 1,
    },
    {
        name: "e_factor",
        size: 1,
    },
    {
        name: "backgroundColor",
        size: 3,
    }
    ],
    vertexShader: voroVS,
    fragmentShader: voroFS,
    dynamicData: { width: texWidth, height: 1 },

}




function gradientDraw(particleSystem: ParticleSystem) {
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
        textures: {
            u_depth_field: "exampleTexture"

        }
    }
}

export { gradientDraw };

export default gradientObject;