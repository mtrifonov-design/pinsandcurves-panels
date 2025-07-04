import { ParticleSystem } from "../../core/ParticleSystem";

const FLOATS_PER_PARTICLE = 5;          // x,y,r,g,b

// minimal FS quad – no per-instance attributes
const voroVS = `#version 300 es
in  vec2 a_pos;
in float particleCount;  // number of particles
in float width;         // width of the texture
in float height;        // height of the texture
in float time;
in vec3 noise;
in vec3 fluidWarp;
out vec3 v_noise;
out vec3 v_fluidWarp;
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
    v_noise = noise;
    v_fluidWarp = fluidWarp;

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
in vec3 v_noise;
in vec3 v_fluidWarp;
in  float v_particleCount; // number of particles
out vec4 outColor;

const int STRIDE  = ${FLOATS_PER_PARTICLE};

float fetch(int index) {             // helper to fetch RED float
  return texelFetch(u_dyn, ivec2(index, 0), 0).r;
}

//
// GLSL textureless classic 3D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-10-11
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

// vec4 mod289(vec4 x)
// {
//   return x - floor(x * (1.0 / 289.0)) * 289.0;
// }

// vec4 permute(vec4 x)
// {
//   return mod289(((x*34.0)+1.0)*x);
// }

// vec4 taylorInvSqrt(vec4 r)
// {
//   return 1.79284291400159 - 0.85373472095314 * r;
// }

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// ---- 4-D simplex noise (GLSL ES 3.00) --------------------------------
vec4 mod289(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

float snoise(vec4 v){
    const vec4 C = vec4(0.138196601125011,   // (5-√5)/20
                        0.276393202250021,   // 2 × C.x
                        0.414589803375032,  -0.447213595499958); // 3 × C.x, −√5/5

    // First corner
    vec4 i  = floor(v + dot(v, vec4(0.309016994374947))); // 1/φ
    vec4 x0 = v - i + dot(i, C.xxxx);

    // Rank-ordering
    vec4 i0;
    vec3 isX = step(x0.yzw, x0.xxx);
    vec3 isYZ = step(x0.zww, x0.yyz);
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;

    vec4 i3 = clamp(i0,          0.0, 1.0);
    vec4 i2 = clamp(i0 - 1.0,    0.0, 1.0);
    vec4 i1 = clamp(i0 - 2.0,    0.0, 1.0);

    vec4 x1 = x0 - i1 + C.xxxx;
    vec4 x2 = x0 - i2 + C.yyzz;          // 2*C.x
    vec4 x3 = x0 - i3 + C.zzzz;          // 3*C.x
    vec4 x4 = x0 + C.wwww;               // -√5/5

    // Permutations
    i = mod289(i);
    vec4 p0 = permute( permute( permute( permute(
             i.w + vec4(0.0, i1.w, i2.w, i3.w))
           + i.z + vec4(0.0, i1.z, i2.z, i3.z))
           + i.y + vec4(0.0, i1.y, i2.y, i3.y))
           + i.x + vec4(0.0, i1.x, i2.x, i3.x));

    // Gradients
    const float inv7 = 1.0/7.0;
    vec4 j = p0 - 49.0 * floor(p0 * inv7 * inv7); // mod(p,7*7)

    vec4 x_ = floor(j * inv7);
    vec4 y_ = floor(j - 7.0 * x_);                // mod(j,7)

    vec4 x = (x_ *inv7) + inv7*0.5;
    vec4 y = (y_ *inv7) + inv7*0.5;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x_.x, y_.x, x_.y, y_.y);
    vec4 b1 = vec4(x_.z, y_.z, x_.w, y_.w);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0 + s0 * sh.xxyy;
    vec4 a1 = b1 + s1 * sh.zzww;

    vec3 g0 = vec3(a0.xy, h.x);
    vec3 g1 = vec3(a0.zw, h.y);
    vec3 g2 = vec3(a1.xy, h.z);
    vec3 g3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(g0,g0), dot(g1,g1),
                                   dot(g2,g2), dot(g3,g3)));
    g0 *= norm.x; g1 *= norm.y; g2 *= norm.z; g3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0.xyz,x0.xyz),
                            dot(x1.xyz,x1.xyz),
                            dot(x2.xyz,x2.xyz),
                            dot(x3.xyz,x3.xyz)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(g0,x0.xyz),
                                dot(g1,x1.xyz),
                                dot(g2,x2.xyz),
                                dot(g3,x3.xyz)));
}



// Classic Perlin noise, periodic variant
float pnoise(vec3 P, vec3 rep)
{
  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
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
    //return noisePeriodicZ(vec4(v * scale, time, speed)); // 2D noise with time and speed
    return pnoise(vec3(v * scale, time * speed), vec3(10000.,100000., speed)); // 2D noise with time and speed
}





vec2 curlNoise(vec2 p, float scale, float time, float speed) {
    float e = 0.0001;
    // valueNoise(): smooth 0‥1 noise (use the earlier function)
    float n1 = valueNoise(p + vec2(0.0,  e), scale, time, speed);
    float n2 = valueNoise(p - vec2(0.0,  e), scale, time, speed);
    float n3 = valueNoise(p + vec2(  e, 0.0), scale, time, speed);
    float n4 = valueNoise(p - vec2(  e, 0.0), scale, time, speed);
    return 2.0 * vec2(n2 - n1, n3 - n4);   // divergence-free field
}


void main() {

    // warp 

    vec2 uv = v_uv;

    float warp_intensity = v_fluidWarp.x; // warp intensity
    float warp_scale = v_fluidWarp.y;
    float warp_speed = v_fluidWarp.z;
    float curlScale = 1.+(1.-warp_scale) * 20.;
    
    for (int i = 0; i < 8; ++i) { // apply flow twice for more effect
        vec2 flow = curlNoise(uv, curlScale, v_time, 100. * warp_speed);
        flow = normalize(flow) * 0.05; // normalize the flow vector
        uv += flow * warp_intensity * warp_scale;   
    }

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
    vec2  d      = (uv - center);
    vec2  uvRot  = vec2(dot(d, dir), dot(d, perp));       // particle-aligned         
    vec2 uvD = uv; // displace UVs with noise

    float dist2 = distanceSquared(uvD, center);
    float w = exp(-dist2 * inv2sigma2);
    vec3 okl = srgbToOKLab(color);
    float sat = length(okl.yz); // OKLab saturation
    oklAccum += okl * w;
    satAccum += sat * w;
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

  // enhance lightning
    //   float noise_intensity = v_noise.x;
    // float noise_scale = v_noise.y;
    // float noise_speed = v_noise.z;
    // float n = valueNoise(uv, noise_scale, v_time, noise_speed* 100.);
    // // Apply noise to the output color
    // outCol += vec3(n) * noise_intensity; // Add noise to the color

    float noise_intensity = v_noise.x;
    float noise_scale = v_noise.y;
    float noise_speed = v_noise.z;
    float n = valueNoise(v_uv, 200. + noise_scale * 300., v_time, noise_speed* 100.);
    // Apply noise to the output color
    outCol += vec3(n+ 0.5) * noise_intensity * 0.001; // Add noise to the color
       
  //outColor = vec4(vec3(20.*curlNoise(v_uv*10.),0.), 1.0);
  outColor = vec4(outCol, 1.0);
  //outColor = vec4(vec3((n+1.) / 2.),1.);
  //outColor = vec4(vec3(noisePeriodicZ(vec4(v_uv * 10.,v_time,200.))), 1.0);
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
        name: "noise",
        size: 3,
    },
    {
        name: "fluidWarp",
        size: 3,
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
        },               // no per-instance data
        dynamicData: dynData,
    }
}

export { gradientDraw };

export default gradientObject;