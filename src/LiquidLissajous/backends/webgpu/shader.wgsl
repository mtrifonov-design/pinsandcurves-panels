/*--------------------------------------------------------------------
  shader_oklab.wgsl – Liquid Lissajous with OKLab blending
--------------------------------------------------------------------*/
struct Particle {
    position : vec2<f32>,
    color    : vec3<f32>,
};

struct Globals {
    resolution : vec2<f32>,
    center     : vec2<f32>,
    particleCount : f32,
    offset : f32, // animation offset (rotation)
    ratioA : f32, // Lissajous ratioA
    ratioB : f32, // Lissajous ratioB
    lissajousOffset : f32, // Lissajous phase offset
    _pad : f32,
};

@group(0) @binding(0) var<uniform>        uni  : Globals;
@group(0) @binding(2) var<uniform>        counts : u32;
@group(0) @binding(1) var<storage, read>  particles : array<f32>;
@group(0) @binding(3) var<uniform>        showPoints : u32;

const PI : f32 = 3.141592653589793;

/*------------ vertex --------------------------------------------*/
struct VsOut {
    @builtin(position) position : vec4<f32>,
    @location(0)       v_uv     : vec2<f32>,
};

@vertex
fn vs_main(
    @location(0) corner : vec2<f32>
) -> VsOut {
    var out : VsOut;
    out.position = vec4<f32>(corner * 2.0 - 1.0, 0.0, 1.0);
    out.v_uv = corner;
    return out;
}

/*------------ OKLab helpers ------------------------------------*/
fn toLinear(c: vec3<f32>) -> vec3<f32> {
    // Approximate sRGB → linear with gamma 2.2
    return pow(c, vec3<f32>(2.2));
}

fn toSRGB(c: vec3<f32>) -> vec3<f32> {
    return pow(clamp(c, vec3<f32>(0.0), vec3<f32>(1.0)), vec3<f32>(1.0 / 2.2));
}

fn srgbToOKLab(c: vec3<f32>) -> vec3<f32> {
    let l = toLinear(c);
    let lms = vec3<f32>(
        0.4122214708 * l.x + 0.5363325363 * l.y + 0.0514459929 * l.z,
        0.2119034982 * l.x + 0.6806995451 * l.y + 0.1073969566 * l.z,
        0.0883024619 * l.x + 0.2817188376 * l.y + 0.6299787005 * l.z
    );
    let cbrt = pow(lms, vec3<f32>(1.0 / 3.0));
    return vec3<f32>(
        0.2104542553 * cbrt.x + 0.7936177850 * cbrt.y - 0.0040720468 * cbrt.z,
        1.9779984951 * cbrt.x - 2.4285922050 * cbrt.y + 0.4505937099 * cbrt.z,
        0.0259040371 * cbrt.x + 0.7827717662 * cbrt.y - 0.8086757660 * cbrt.z
    );
}

fn oklabToSRGB(o: vec3<f32>) -> vec3<f32> {
    let l_ = o.x + 0.3963377774 * o.y + 0.2158037573 * o.z;
    let m_ = o.x - 0.1055613458 * o.y - 0.0638541728 * o.z;
    let s_ = o.x - 0.0894841775 * o.y - 1.2914855480 * o.z;

    let l3 = l_ * l_ * l_;
    let m3 = m_ * m_ * m_;
    let s3 = s_ * s_ * s_;

    let rgb = vec3<f32>(
        4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
       -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
       -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3
    );
    return toSRGB(rgb);
}

/*------------ fragment ------------------------------------------*/
// --- Turbulent Displacement (modular, can be disabled) ---
fn valueNoise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let a = fract(sin(dot(i, vec2<f32>(127.1, 311.7))) * 43758.5453);
    let b = fract(sin(dot(i + vec2<f32>(1.0, 0.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
    let c = fract(sin(dot(i + vec2<f32>(0.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
    let d = fract(sin(dot(i + vec2<f32>(1.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453);
    let u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn turbulentDisplace(p: vec2<f32>, amount: f32, freq: f32, octaves: i32, gain: f32, lacunarity: f32) -> vec2<f32> {
    var disp = vec2<f32>(0.0);
    var amp = 1.0;
    var f = freq;
    var totalAmp = 0.0;
    for (var i = 0; i < octaves; i = i + 1) {
        let n1 = valueNoise(p * f);
        let n2 = valueNoise((p + 100.0) * f);
        disp += (vec2<f32>(n1, n2) * 2.0 - vec2<f32>(1.0, 1.0)) * amp;
        totalAmp += amp;
        amp *= gain;
        f *= lacunarity;
    }
    disp = disp / totalAmp;
    return p + disp * amount;
}
// --- End Turbulent Displacement ---

@fragment
fn fs_main(
    @location(0) v_uv : vec2<f32>,
) -> @location(0) vec4<f32> {
    var fragCoord = v_uv * uni.resolution;
    // --- Turbulent Displacement Layer (toggle by commenting next line) ---
    // fragCoord = turbulentDisplace(fragCoord, 200.0, 0.0015, 5, 0.5, 2.0); // amount, freq, octaves, gain, lacunarity
    // --- End Turbulent Displacement Layer ---
    let count = counts;
    let sigma = 320.0; // Gaussian width in pixels (tune as needed)
    let inv2sigma2 = 1.0 / (2.0 * sigma * sigma);

    // --- Rotation: rotate all particle points by offset*2*PI about center ---
    let rot = 0.; //sin(uni.offset * 2.0 * PI) *  0.5 * PI +  0.25 * PI;
    let center = uni.center * uni.resolution;

    var oklAccum = vec3<f32>(0.0);
    var total = 0.0;

    for (var i = 0u; i < count; i = i + 1u) {
        let base = i * 5u;
        let px = particles[base + 0u];
        let py = particles[base + 1u];
        // Rotate about center
        let dx = px - center.x;
        let dy = py - center.y;
        let cosr = cos(rot);
        let sinr = sin(rot);
        let rx = cosr * dx - sinr * dy + center.x;
        let ry = sinr * dx + cosr * dy + center.y;
        let pr = particles[base + 2u];
        let pg = particles[base + 3u];
        let pb = particles[base + 4u];

        let dist2 = distanceSquared(fragCoord, vec2<f32>(rx, ry));
        let w = exp(-dist2 * inv2sigma2);
        oklAccum += srgbToOKLab(vec3<f32>(pr, pg, pb)) * w;
        total += w;
    }

    var color = vec3<f32>(0.0);
    if (total > 0.0) {
        color = oklabToSRGB(oklAccum / total);
    }

    // Overlay control points if enabled
    if (showPoints == 1u) {
        let pointRadius = 10.0;
        let outlineRadius = 12.0;
        var found = false;
        var foundColor = vec3<f32>(1.0, 1.0, 1.0);
        for (var i = 0u; i < count; i = i + 1u) {
            let base = i * 5u;
            let px = particles[base + 0u];
            let py = particles[base + 1u];
            // Rotate about center for overlay as well
            let dx = px - center.x;
            let dy = py - center.y;
            let cosr = cos(rot);
            let sinr = sin(rot);
            let rx = cosr * dx - sinr * dy + center.x;
            let ry = sinr * dx + cosr * dy + center.y;
            let dist = length(fragCoord - vec2<f32>(rx, ry));
            if (dist < outlineRadius) {
                found = true;
                foundColor = vec3<f32>(particles[base+2u], particles[base+3u], particles[base+4u]);
                // If within inner radius, use color; if in outline, use white
                if (dist < pointRadius) {
                    return vec4<f32>(foundColor, 1.0);
                } else {
                    return vec4<f32>(1.0, 1.0, 1.0, 1.0);
                }
            }
        }
    }
    return vec4<f32>(color, 0.0);

}

// Helper for squared distance (cheaper than length)
fn distanceSquared(a: vec2<f32>, b: vec2<f32>) -> f32 {
    let d = a - b;
    return dot(d, d);
}

// Use the new Lissajous parameters in the shader as needed
// Example: (add this to the main loop or wherever the Lissajous curve is computed)
// let lissajousX = cos(uni.ratioA * t + uni.lissajousOffset);
// let lissajousY = sin(uni.ratioB * t);
// (You can use uni.offset for animation phase, uni.lissajousOffset for static phase offset)
