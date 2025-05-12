/*--------------------------------------------------------------------
  shader.wgsl – “no-fetch” version
--------------------------------------------------------------------*/
struct Ray {
    angle    : f32, variance : f32,
    start    : f32, end      : f32,
    softness : f32, radColor : f32,
    cA_r     : f32, cA_g     : f32,
    cA_b     : f32, cB_r     : f32,
    cB_g     : f32, cB_b     : f32,
    center        : vec2<f32>
};

struct Globals {
    resolution : vec2<f32>,
    center     : vec2<f32>,
    waveAmplitude: f32,
    waveFrequency: f32,
};
@group(0) @binding(0) var<uniform>        uni  : Globals;
@group(0) @binding(1) var<storage, read>  rays : array<Ray>;

const PI : f32 = 3.141592653589793;

/* helpers (unchanged) ------------------------------------------- */
fn wrap(a:f32)->f32{ return (a+PI) % (2.0*PI) - PI; }
fn angularGaussian(t:f32,a:f32,v:f32)->f32{
    let d = wrap(t-a);  return exp(-0.5*d*d/(v*v));
}
fn radialMask(r:f32,s:f32,e:f32,soft:f32)->f32{
    let up=smoothstep(s,s+soft,r); let dn=smoothstep(e-soft,e,r);
    return up*(1.0-dn);
}
fn radialGradient(r:f32,R:f32)->f32{ return clamp(r/R,0.0,1.0); }

/*------------ vertex --------------------------------------------*/
struct VsOut {
    @builtin(position) position : vec4<f32>,
    @location(0)       v_pos    : vec2<f32>,

    /* flat varyings with the whole ray record */
    @location(1) @interpolate(flat) p0 : vec4<f32>,   // angle, var, start, end
    @location(2) @interpolate(flat) p1 : vec4<f32>,   // soft, rad, cA.r, cA.g
    @location(3) @interpolate(flat) p2 : vec4<f32>,   // cA.b, cB.r, cB.g, cB.b
    @location(4) @interpolate(flat) center : vec2<f32>,
};

@vertex
fn vs_main(
    @location(0) corner : vec2<f32>,
    @builtin(instance_index) id : u32
) -> VsOut {
    let ray = rays[id];

    let width = ray.variance * 3.0 + ray.softness * 1.5;
    let asp   = uni.resolution.x / uni.resolution.y;
    let dir   = vec2<f32>(cos(ray.angle)/asp, sin(ray.angle));
    let nrm   = normalize(vec2<f32>(-dir.y, dir.x));

    let along = mix(ray.start, ray.end, corner.x);
    let pos   = uni.center + dir*along + nrm*width*corner.y;

    var out : VsOut;
    out.position = vec4<f32>(pos*2.0-1.0, 0.0, 1.0);
    out.v_pos    = pos;

    out.p0 = vec4<f32>(ray.angle, ray.variance, ray.start, ray.end);
    out.p1 = vec4<f32>(ray.softness, ray.radColor, ray.cA_r, ray.cA_g);
    out.p2 = vec4<f32>(ray.cA_b, ray.cB_r, ray.cB_g, ray.cB_b);
    out.center = uni.center;
    return out;
}

/*------------ fragment ------------------------------------------*/
@fragment
fn fs_main(
    @location(0) v_pos : vec2<f32>,
    @location(1) @interpolate(flat) p0 : vec4<f32>,
    @location(2) @interpolate(flat) p1 : vec4<f32>,
    @location(3) @interpolate(flat) p2 : vec4<f32>,
    @location(4) @interpolate(flat) center : vec2<f32>,
) -> @location(0) vec4<f32> {
    let angle     = p0.x;  
    let variance = p0.y;
    let startDist = p0.z;  
    let endDist  = p0.w;
    let softness  = p1.x;  
    let radColor = p1.y;

    let colA = vec3<f32>(p1.z, p1.w, p2.x);
    let colB = vec3<f32>(p2.y, p2.z, p2.w);

    var uv = v_pos - center;
    uv.x  *= uni.resolution.x / uni.resolution.y;

    let r     = length(uv);
    let theta = atan2(uv.y, uv.x);

    let freq   = uni.waveFrequency;          // waves per unit radius
    let arc    = uni.waveAmplitude;          // arc-length of each wobble in “scene units”
    let phase  = 0.0;
    let dθ     = (arc / max(r, 1e-4)) *            // 1/r keeps arc-length fixed
                sin(freq * r + phase);            // linear-in-r → constant spacing
    let wA = angularGaussian(theta, angle + dθ, variance);

    let wR = radialMask     (r,     startDist, endDist, softness);
    let wG = radialGradient (r,     radColor);

    let col = mix(colA, colB, wG) * (wA * wR);
    return vec4<f32>(col, 1.0);   // additive blending
    // return vec4<f32>(v_pos, 0.0, 1.0);
}