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
    _pad : vec3<f32>,
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


fn hash2(p: vec2<f32>) -> f32 {
    let dotp = dot(p, vec2<f32>(127.1, 311.7));
    return fract(sin(dotp) * 43758.5453);
}

fn valueNoise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    // Four corners
    let a = hash2(i);
    let b = hash2(i + vec2<f32>(1.0, 0.0));
    let c = hash2(i + vec2<f32>(0.0, 1.0));
    let d = hash2(i + vec2<f32>(1.0, 1.0));
    // Bilinear interpolation
    let u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/*------------ fragment ------------------------------------------*/
@fragment
fn fs_main(
    @location(0) v_uv : vec2<f32>,
) -> @location(0) vec4<f32> {
    // Convert UV to polar coordinates (centered at 0.5,0.5), correct for aspect ratio
    let aspect = uni.resolution.x / uni.resolution.y;
    var uv = v_uv - vec2<f32>(0.5, 0.5);
    uv.x = uv.x * aspect;
    let r = length(uv) * 2.0; // [0,1] at edge
    // Map r to [0,1]
    let t_r = r;
    let count = counts;
    // Map t_r to [0, count] so that 0 and 1 both map to the first color, and stops are equidistant
    let stops = f32(count);
    let t_scaled = t_r * stops * 0.5;
    let idx0 = u32(floor(t_scaled)) % count;
    let idx1 = (idx0 + 1u) % count;
    let frac = t_scaled - floor(t_scaled);
    let base0 = idx0 * 5u;
    let base1 = idx1 * 5u;
    let c0 = vec3<f32>(particles[base0+2u], particles[base0+3u], particles[base0+4u]);
    let c1 = vec3<f32>(particles[base1+2u], particles[base1+3u], particles[base1+4u]);
    // Interpolate in OKLab
    let okl0 = srgbToOKLab(c0);
    let okl1 = srgbToOKLab(c1);
    let okl = mix(okl0, okl1, frac);
    let color = oklabToSRGB(okl);
    return vec4<f32>(color, 1.0);
}

// Helper for squared distance (cheaper than length)
fn distanceSquared(a: vec2<f32>, b: vec2<f32>) -> f32 {
    let d = a - b;
    return dot(d, d);
}
