import { ParticleSystem } from "../../core/ParticleSystem";

const FLOATS_PER_PARTICLE = 5;          // x,y,r,g,b

// minimal FS quad – no per-instance attributes
const voroVS = `#version 300 es
in  vec2 a_pos;
in float particleCount;  // number of particles
in float width;         // width of the texture
in float height;        // height of the texture
in float time;
in float noise_intensity;
in float warp_intensity;
out float v_noise_intensity;
out float v_warp_intensity;
out vec2 v_uv;
out float v_particleCount;
out float v_width;       // pass to FS
out float v_height;      // pass to FS
out float v_time;
void main() {
  v_uv = a_pos;          // 0‥1
v_particleCount = particleCount;   // pass to FS    
  gl_Position = vec4(a_pos, 0.0, 1.0);
    v_width = width;      // pass to FS
    v_height = height;    // pass to FS
    v_noise_intensity = noise_intensity; 
    v_warp_intensity = warp_intensity;
    v_time = time;
}`;

const voroFS = `#version 300 es
precision highp float;
uniform sampler2D u_dyn;
uniform sampler2D u_noise;
in  float v_width;        // width of the texture
in float v_height;       // height of the texture
in  float v_time;         // time, not used
in  vec2 v_uv;
in  float v_noise_intensity; 
in  float v_warp_intensity;
in  float v_particleCount; // number of particles
out vec4 outColor;

const int STRIDE  = ${FLOATS_PER_PARTICLE};

float fetch(int index) {             // helper to fetch RED float
  return texelFetch(u_dyn, ivec2(index, 0), 0).r;
}

// Helper for squared distance (cheaper than length)
float distanceSquared(vec2 a, vec2 b) {
    a = a + vec2(1.);
    b = b + vec2(1.);
    a = a * vec2(0.5); // * vec2(v_width, v_height); 
    b = b * vec2(0.5); // * vec2(v_width, v_height); 
    vec2 d = a - b;
    return dot(d, d);
}

// --- sRGB <-> OKLab conversion functions (from WGSL, ported to GLSL) ---
vec3 toLinear(vec3 c) {
    return pow(c, vec3(2.2));
}
vec3 toSRGB(vec3 c) {
    return pow(clamp(c, vec3(0.0), vec3(1.0)), vec3(1.0 / 2.2));
}
vec3 srgbToOKLab(vec3 c) {
    vec3 l = toLinear(c);
    vec3 lms = vec3(
        0.4122214708 * l.x + 0.5363325363 * l.y + 0.0514459929 * l.z,
        0.2119034982 * l.x + 0.6806995451 * l.y + 0.1073969566 * l.z,
        0.0883024619 * l.x + 0.2817188376 * l.y + 0.6299787005 * l.z
    );
    vec3 cbrt = pow(lms, vec3(1.0 / 3.0));
    return vec3(
        0.2104542553 * cbrt.x + 0.7936177850 * cbrt.y - 0.0040720468 * cbrt.z,
        1.9779984951 * cbrt.x - 2.4285922050 * cbrt.y + 0.4505937099 * cbrt.z,
        0.0259040371 * cbrt.x + 0.7827717662 * cbrt.y - 0.8086757660 * cbrt.z
    );
}
vec3 oklabToSRGB(vec3 o) {
    float l_ = o.x + 0.3963377774 * o.y + 0.2158037573 * o.z;
    float m_ = o.x - 0.1055613458 * o.y - 0.0638541728 * o.z;
    float s_ = o.x - 0.0894841775 * o.y - 1.2914855480 * o.z;
    float l3 = l_ * l_ * l_;
    float m3 = m_ * m_ * m_;
    float s3 = s_ * s_ * s_;
    vec3 rgb = vec3(
        4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
       -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
       -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3
    );
    return toSRGB(rgb);
}
// --- End OKLab helpers ---





// -- NEW: vector hash that gives a pseudo-random gradient -------------
vec3 hash3(vec3 p) {
    // same idea, just stir the components differently
    p = fract(p * vec3(0.1031, 0.11369, 0.13787));
    p += dot(p, p.yzx + 33.33);
    return fract((p.xxy + p.yzz) * p.zyx) * 2.0 - 1.0;  // → [-1,1]^3
}

float noisePeriodicZ( in vec4 x )
{
    float R = x.w;                 // repeat length in Z
    x.z = x.z * R;

    // grid cell and in-cell position
    vec3 p = floor(x.xyz);
    vec3 w = fract(x.xyz);

    // quintic smoothstep
    vec3 u = w*w*w*(w*(w*6.0 - 15.0) + 10.0);

    // ----- WRAP THE Z INDEX -----
    float pz0 = mod(p.z, R);             // “bottom” layer     (0 … R-ε)
    if (pz0 < 0.0) pz0 += R;             // keep it positive
    float pz1 = mod(pz0 + 1.0, R);       // “top” layer (wrapped)
    // --------------------------------

    // gradient vectors – Z wrapped, X/Y unwrapped
    vec3 ga = hash3(vec3(p.x  , p.y  , pz0));
    vec3 gb = hash3(vec3(p.x+1., p.y  , pz0));
    vec3 gc = hash3(vec3(p.x  , p.y+1., pz0));
    vec3 gd = hash3(vec3(p.x+1., p.y+1., pz0));
    vec3 ge = hash3(vec3(p.x  , p.y  , pz1));
    vec3 gf = hash3(vec3(p.x+1., p.y  , pz1));
    vec3 gg = hash3(vec3(p.x  , p.y+1., pz1));
    vec3 gh = hash3(vec3(p.x+1., p.y+1., pz1));

    // projections
    float va = dot( ga, w - vec3(0.0,0.0,0.0) );
    float vb = dot( gb, w - vec3(1.0,0.0,0.0) );
    float vc = dot( gc, w - vec3(0.0,1.0,0.0) );
    float vd = dot( gd, w - vec3(1.0,1.0,0.0) );
    float ve = dot( ge, w - vec3(0.0,0.0,1.0) );
    float vf = dot( gf, w - vec3(1.0,0.0,1.0) );
    float vg = dot( gg, w - vec3(0.0,1.0,1.0) );
    float vh = dot( gh, w - vec3(1.0,1.0,1.0) );

    // trilinear blend
    return va +
           u.x*(vb - va) +
           u.y*(vc - va) +
           u.z*(ve - va) +
           u.x*u.y*(va - vb - vc + vd) +
           u.y*u.z*(va - vc - ve + vg) +
           u.z*u.x*(va - vb - ve + vf) +
           u.x*u.y*u.z*(-va + vb + vc - vd + ve - vf - vg + vh);
}

float valueNoise(vec2 v, float scale, float time, float speed){
    return noisePeriodicZ(vec4(v * scale, time, speed)); // 2D noise with time and speed
}



vec2 curlNoise(vec2 p, float scale, float time, float speed) {
    float e = 0.001;
    // valueNoise(): smooth 0‥1 noise (use the earlier function)
    float n1 = valueNoise(p + vec2(0.0,  e), scale, time, speed);
    float n2 = valueNoise(p - vec2(0.0,  e), scale, time, speed);
    float n3 = valueNoise(p + vec2(  e, 0.0), scale, time, speed);
    float n4 = valueNoise(p - vec2(  e, 0.0), scale, time, speed);
    return 2.0 * vec2(n2 - n1, n3 - n4);   // divergence-free field
}


void main() {
  vec3 oklAccum = vec3(0.0);
  float satAccum = 0.0;
  float total = 0.0;
  int PCOUNT = int(v_particleCount); // number of particles
  float sigma = 0.228; // Gaussian width in normalized units, matches WGSL
  float inv2sigma2 = 1.0 / (2. * sigma * sigma);

  for (int i = 0; i < PCOUNT; ++i) {
    int base = i * STRIDE;
    vec2 center = vec2(fetch(base), fetch(base + 1)); // [0,1] normalized
    vec3 color = vec3(fetch(base + 2), fetch(base + 3), fetch(base + 4));

    int nextIndex = (i + 1 < PCOUNT) ? (i + 1) : 0;       // wrap last→first
    int nextBase  = nextIndex * STRIDE;
    vec2 nextCenter = vec2(fetch(nextBase), fetch(nextBase + 1));
        vec2 dir = normalize(nextCenter - center);            // forward axis
    // guard against zero-length when PCOUNT==1
    if (all(equal(dir, vec2(0.0)))) dir = vec2(1.0, 0.0);
    vec2 perp = vec2(-dir.y, dir.x);  
    vec2  d      = (v_uv - center);
    vec2  uvRot  = vec2(dot(d, dir), dot(d, perp));       // particle-aligned

    vec2 uv = v_uv;
    //vec2 evolution = .5 * vec2(sin(v_time * 2. * 3.14), cos(v_time * 2. * 3.14));

    float curlScale = (1.-v_warp_intensity) * 10.;
    vec2 flow = curlNoise(uv, curlScale, v_time, 100. * v_warp_intensity);
    uv += flow;                       
    // for(int k=0;k<1;k++){                 // 3 iterations ≈ fluid-like
    //     vec2 flow = curlNoise(uv * 1. + evolution) * (10. * v_warp_intensity);
    //     uv += flow;                       // walk through the vector field
    // }
    vec2 uvD = uv; // displace UVs with noise

    float dist2 = distanceSquared(uvD, center);
    float w = exp(-dist2 * inv2sigma2);
    vec3 okl = srgbToOKLab(color);
    float sat = length(okl.yz); // OKLab saturation
    oklAccum += okl * w;
    satAccum += sat * w;


    float offsetTime = float(i) / float(PCOUNT);
    uvRot  = uvRot * (5. - 4. * v_noise_intensity) + (1. + 10. * v_noise_intensity) * vec2(v_time);
    float noise = texture(u_noise, uvRot).r;
    float noiseBand = 0.2 * v_noise_intensity;
    w = mix(w * (1.-noiseBand), w * (1. + noiseBand), noise); // mix with gray based on noise

    total += w;
  }
  vec3 outCol = vec3(0.0);
  if (total > 0.0) {
    vec3 oklBlended = oklAccum / total;
    float satBlended = length(oklBlended.yz);
    float satTarget = satAccum / total;
    float factor = (satBlended > 0.0) ? (satTarget / satBlended) : 1.0;
    // Clamp factor to avoid extreme values
    factor = clamp(factor, 0.1, 1.3);
    // Apply correction to a and b (oklBlended.yz)
    oklBlended.yz *= factor;
    outCol = oklabToSRGB(oklBlended);
  }

  //outColor = vec4(vec3(20.*curlNoise(v_uv*10.),0.), 1.0);
  outColor = vec4(outCol, 1.0);
  //outColor = vec4(vec3(noisePeriodicZ(vec4(v_uv * 10.,v_time,20.))), 1.0);
}`;


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
        name: "noise_intensity",
        size: 1,
    },
    {
        name: "warp_intensity",
        size: 1,
    }
    ],
    vertexShader: voroVS,
    fragmentShader: voroFS,
    dynamicData: { width: texWidth, height: 1 },
}




function gradientDraw(particleSystem: ParticleSystem) {
    // Store particle positions in normalized [0,1] coordinates
    const particles = particleSystem.PARTICLES.map(p => {
        return {
            ...p,
            x: (p.x / particleSystem.WIDTH) * 2 -1, // map to 0..1
            y: (p.y / particleSystem.HEIGHT) * 2 -1, // map to 0..1
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

    const widthArr = new Float32Array([particleSystem.WIDTH]);
    const heightArr = new Float32Array([particleSystem.HEIGHT]);
    const timeArr = new Float32Array([particleSystem.REL_TIME]);
    const noiseIntensityArr = new Float32Array([particleSystem.NOISE_INTENSITY]);
    const warpIntensityArr = new Float32Array([particleSystem.WARP_INTENSITY]);

    return {
        count: 1,
        attributes: {
            particleCount: new Float32Array([P]),  // number of particles
            width: widthArr,                       // width of the texture
            height: heightArr,                     // height of the texture
            time: timeArr,                         // current time
            noise_intensity: noiseIntensityArr,    // noise intensity
            warp_intensity: warpIntensityArr,      // warp intensity
        },               // no per-instance data
        dynamicData: dynData,
        textures: {
            u_noise: "noiseTex"
        }
    }
}

export { gradientDraw };

export default gradientObject;