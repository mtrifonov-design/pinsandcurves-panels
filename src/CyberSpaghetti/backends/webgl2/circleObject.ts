import { ParticleSystem } from "../../core/ParticleSystem";

const circleVS = `#version 300 es
in vec2 a_pos;          // quad corner (-1..1)
in float relTime;
in float radius;        // instance radius (clip-space)
in vec3 fillColor;      // per-instance RGB
in vec2 resolution;     // instance resolution (not used, but required)
in vec2 linePointA;     // start of the line
in vec2 linePointB;     // end of the line
in vec3 stroke; // thickness and cap and feather
in float offsetStart; // normalized [0,1] start of the capsule segment
in float offsetEnd;   // normalized [0,1] end of the capsule segment
in float amplitude; // amplitude of the distortion
in float frequency; // frequency of the distortion
in float perspectiveSkew; // perspective skew factor (0 = no skew, 1 = full skew)
in int distortType; // distortion type: 0 = sine, 1 = zigzag, 2 = electric
in float phaseOffset; // phase offset for the distortion
out vec2 v_local;        // coord inside quad (-1..1)
out vec3 v_color;
out float v_thickness;   // thickness parameter
out float v_feather;     // feather parameter
out float v_length; // length of the line segment
out float v_offsetStart;
out float v_offsetEnd;
out float v_relTime;
out float v_strokeCap; // not used, but required for WebGL2
out float v_amplitude; // amplitude of the distortion
out float v_frequency; // frequency of the distortion
out float v_perspectiveSkew; // perspective skew factor
out float v_phaseOffset; // phase offset for the distortion
flat out int v_distortType; // distortion type: 0 = sine, 1 = zigzag, 2 = electric

// ---------------------------------------------------------------------
// Perspective matrix  (column-major, OpenGL clip conventions)
//
// fovDeg     – vertical field of view in degrees
// aspect     – viewport width / height
// zNear/zFar – clip planes (>0, zNear < zFar)
// vpOffset   – vanishing-point offset in NDC units  (0,0 = centre)
//
// Returns a mat4 that you can multiply with view & model transforms.
//
// ---------------------------------------------------------------------
mat4 makePerspective(float fovDeg,
                     float aspect,
                     float zNear,
                     float zFar,
                     vec2  vpOffset)
{
    float f = 1.0 / tan(radians(fovDeg) * 0.5);    // cot(fov/2)
    float nf = 1.0 / (zNear - zFar);

    // Column-major constructor: each group of four numbers is a column.
    return mat4(
        f / aspect, 0.0,        vpOffset.x,                0.0,
        0.0,        f,          vpOffset.y,                0.0,
        0.0,        0.0,  (zFar + zNear)*nf,  2.0*zFar*zNear*nf,
        0.0,        0.0,       -1.0,                      0.0
    );
}



mat4 lookAtMatrix(vec3 eye, vec3 center, vec3 up)
{
    // Forward (camera –> world)  — points from eye to target
    vec3  f = normalize(center - eye);

    // Side axis
    vec3  s = normalize(cross(f, up));

    // True up  (re-orthogonalised)
    vec3  u = cross(s, f);

    // Column-major constructor: each group of 4 values is ONE column
    return mat4(
        vec4(  s,           0.0),          // X-axis
        vec4(  u,           0.0),          // Y-axis
        vec4(-f,           0.0),           // −Z (camera looks down –Z)
        vec4(-dot(s, eye),                 // translation
             -dot(u, eye),
              dot(f, eye),
              1.0)
    );
}  

void main() {

  float aspect = resolution.x / resolution.y; // aspect ratio from instance attributes
  float zFar = mix(-0.5, -10., perspectiveSkew);
  float zNear = -0.5;
  vec3 lA = normalize(vec3(linePointA,1.)) * zFar;
  vec3 lB = normalize(vec3(linePointB,1.)) * zNear;

  float t = (a_pos.x + 1.0) * 0.5; // [0,1] along the segment
  vec3 lineDir = normalize(lB - lA);
  vec3 originDir = normalize(lA - vec3(0.0, 0.0, 0.0));
  // The plane is spanned by originDir and lineDir
  vec3 extrusionDir = normalize(cross(originDir, lineDir));
  vec3 center = mix(lA, lB, t); 
  float extrusion = stroke.x * amplitude * 2.;
  vec4 eyePos = vec4(center + extrusionDir * (a_pos.y * extrusion), 1.0);

  // --- correct projection ---
  mat4 proj = makePerspective(5.0, aspect, 3., 100.0, vec2(0.));

  // --- final clip coords ---
  gl_Position = proj * eyePos;

  v_local = vec2(a_pos.x, a_pos.y);

  v_length = length(lB - lA); // pass length to fragment shader
  v_phaseOffset = phaseOffset; // pass phase offset to fragment shader

  v_color = fillColor;
  v_thickness = stroke.x;
  v_feather = stroke.z;
  v_offsetStart = offsetStart;
  v_offsetEnd = offsetEnd;
  v_amplitude = amplitude * 0.5;
  v_frequency = frequency;
  v_strokeCap = stroke.y; // not used, but required for WebGL2
  v_perspectiveSkew = perspectiveSkew;
  v_relTime = relTime; // pass relative time to fragment shader
  v_distortType = distortType; // pass distortion type to fragment shader
}`;

const circleFS = `#version 300 es
precision highp float;
in  vec2 v_local;
in  vec3 v_color;
in float v_length; // length of the line segment
in float v_thickness; // thickness parameter
in float v_feather; // feather parameter
in float v_offsetStart;
in float v_offsetEnd;
in float v_strokeCap; // not used, but required for WebGL2
in float v_relTime; // relative time for each ray
in float v_amplitude; // amplitude of the distortion
in float v_frequency; // frequency of the distortion
in float v_perspectiveSkew; // perspective skew factor
in float v_phaseOffset; // phase offset for the distortion
flat in int v_distortType; // distortion type: 0 = sine, 1 = zigzag, 2 = electric
out vec4 outColor;

// Toggle bounding box display
const bool showBoundingBox = false;



// Signed distance to normalized uneven capsule between two points with varying radii
// Returns -1 at the innermost point, 0 at the edge
float sdUnevenCapsuleNorm(vec2 p, vec3 a, vec3 b) {
    vec2 pa = p - a.xy;
    vec2 ba = b.xy - a.xy;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float r = mix(a.z, b.z, h);
    vec2 c = a.xy + ba * h;
    float d_1 = length(p - c) - r;
    // Distance from point to line segment (without radii)
    float d_2 = length(p - c);
    // Blend as requested
    float d = d_2 / (d_2 - d_1);
    return d - 1.;
}

// Signed distance to axis-aligned bounding box in normalized capsule space
// The quad is now p.x in [-1,1], p.y in [-1,1] after normalization
float sdBoundingBox(vec2 p, vec2 b) {
    // b.x = half-extent in x, b.y = half-extent in y
    vec2 center = vec2(0.0, 0.0); // after normalization, center is at (0,0)
    vec2 d = abs(p - center) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// helper 
float freqModulate(float x, float t ) {
  return (t * ((exp(t*x)-1.)/(exp(t)-1.)));

}

// Distortion function for the ray
vec2 distortRay(vec2 p, float amplitude, float frequency, float phase, int type, float balance, float time) {
    float x = p.x;
    float y = p.y;
    // Modulate amplitude by balance: balance=1 → full amplitude, balance=0 → amplitude ramps from 0 to full
    float t = (x + 1.0) * 0.5; // map x from [-1,1] to [0,1]

    // Modulate phase nonlinearly for perspective effect
    float phaseT = 1.-t; 
    //float ampMod = mix(t*t,1.,balance*balance); // x in [-1,1], so x*x ramps from 0 to 1 at ends
    float localAmp = amplitude; // * ampMod;
    float offset = 0.0;
    if (type == 0) {
        // Sine
        offset = localAmp * sin(phaseT * frequency + phase + time * .5 * frequency);
    } else if (type == 1) {
        // Zigzag (triangle wave)
        float tri = abs(fract(phaseT * frequency / 3.14159265359 + phase + time * .25 * frequency) * 2.0 - 1.0) * 2.0 - 1.0;
        offset = localAmp * tri;
    } else if (type == 2) {
        // Electric (randomized jagged)
        float s = sin(phaseT * frequency + phase) * sin(3.7 * phaseT * frequency + 1.3 + phase) * sin(7.3 * phaseT * frequency + 2.1 + phase);
        offset = localAmp * s;
    }
    return vec2(x, y + offset);
}

float stroke(vec2 p, float offsetStart, float offsetEnd, float thickness, float cap) {
  float y = abs(p.y);
  float maxStrokeCap = 15.;
  cap = cap * maxStrokeCap + .1;
  float x = 2.*smoothstep(offsetStart, offsetEnd, p.x) -1.;
  float n = cap;
  float rY = pow((1.-pow(abs(x),n)),1./n) * thickness;
  float d = (y - rY) / thickness;
  return d;
}

void main() {

  float v_balance = 1.-v_perspectiveSkew; // balance is 1 when skew is 0, 0 when skew is 1


  // Normalize x so circles stay circles regardless of v_length
  float aspect = v_length / 2.0;
  vec2 p = v_local;

  // Distortion parameters (could be uniforms or varyings in future)
  float amplitude = v_amplitude;
  float thickness = v_thickness;
  float frequency = v_frequency * 100.;
  float phase = v_phaseOffset * 6.28318530718; // 2 * PI for full cycle

  // Apply distortion to the normalized coordinates, modulated by balance
  vec2 p_distorted = distortRay(p, amplitude, frequency, phase, v_distortType, v_balance, v_relTime);
  float width = v_offsetEnd - v_offsetStart;
  float d = stroke(p_distorted,v_offsetStart, v_offsetEnd, 1. * width, v_strokeCap);

  // Draw bounding box if enabled
  if (showBoundingBox) {
    float bbox = sdBoundingBox(p, vec2(1.0, 1.0));
    if (abs(bbox) < 0.01) {
      outColor = vec4(1.,1.,1., 1.0);
      return;
    }
  }

  // UV overlay for debugging: (-1,-1) = red, (1,1) = green
  bool showUVOverlay = false;
  if (showUVOverlay) {
    // p is the normalized coordinate in [-1,1] for both axes
    float t = clamp((p.x + p.y + 2.0) * 0.25, 0.0, 1.0); // 0 at (-1,-1), 1 at (1,1)
    vec3 uvColor = mix(vec3(1,0,0), vec3(0,1,0), t);
    outColor = vec4(uvColor, 0.5); // semi-transparent overlay
    return;
  }

  // Feathered edge logic using normalized SDF and thresholded smoothstep
  float alpha = 1.0 - (smoothstep(-sqrt(v_feather), 0.0, d));
  //float alpha = pow(baseAlpha,1.);
  // Apply smoothstep fade at start and end of v_local.x
  alpha *= smoothstep(-1., -.9, v_local.x) * smoothstep(1.0, 0.9, v_local.x);
  
  // if (alpha <= 0.0) discard;
  
  // === UV debug output flag ===
  const bool showUV = false; // Set to false to disable UV debug
  if (showUV) {
    // Perspective-correct UV debug output
    vec2 uv = (v_local + 1.0) * 0.5;
    outColor = vec4(uv, 0.0, 1.0);
    return;
  }
  // === End UV debug ===
  
  outColor = vec4(v_color, alpha);
}`;

const circleObject = {
            name: "circle",
            instanceAttributes: [
                { name: "stroke", size: 3 },
                { name: "linePointA", size: 2},
                { name: "linePointB", size: 2},
                { name: "fillColor", size: 3 },
                { name: "resolution", size: 2 }, 
                { name: "offsetStart", size: 1 },
                { name: "offsetEnd", size: 1 },
                { name: "amplitude", size: 1 },
                { name: "frequency", size: 1 },
                { name: "perspectiveSkew", size: 1 },
                { name: "distortType", size: 1, type:"int" }, // 0 = sine, 1 = zigzag, 2 = electric
                { name: "phaseOffset", size: 1 },
                { name: "relTime", size: 1 },
            ],
            vertexShader: circleVS,
            fragmentShader: circleFS,
        }

function getDistortType(pattern: string): number {
    switch (pattern) {
        case "sine":
            return 0; // sine
        case "zigzag":
            return 1; // zigzag
        case "jitter":
            return 2; // electric
        default:
            console.warn(`Unknown distortion pattern: ${pattern}, defaulting to sine.`);
            return 0; // default to sine
    }
}

function repeat(val: number | number[], times: number, options : { type?: "float32" | "uint32" } = { type: "float32" }) {
  const array = [];
  if (typeof val === "number") {
    array.push(...Array(times).fill(val));
  } else if (Array.isArray(val)) {
    for (let i = 0; i < times; i++) {
      array.push(...val);
    }
  } else {
    throw new Error("Unsupported value type for repeat: " + typeof val);
  }
  if (options.type === "uint32") {
    return new Uint32Array(array);
  }
  if (options.type === "float32") {
    return new Float32Array(array);
  }
}

export function circleDraw(particleSystem: ParticleSystem) {
  const numRays = particleSystem.CONFIG.numRays;

  const offsetStart = [];
  const offsetEnd = [];
  const linePointA = [];
  const linePointB = [];
  const fillColor = [];
  const stroke = [];
  const phaseOffset = [];
  const relTime = [];
  const thickness = [];
  for (let i = 0; i < numRays; i++) {
    const ray = particleSystem.rays[i];
    if (!ray) continue; // skip if ray is not defined
    offsetStart.push(ray.offset[0]);
    offsetEnd.push(ray.offset[1]);
    linePointA.push(ray.startPoint[0], ray.startPoint[1]);
    linePointB.push(ray.endPoint[0], ray.endPoint[1]);
    fillColor.push(...ray.color.map(c => c / 255.)); // normalize RGB to [0,1]
    phaseOffset.push(ray.phaseOffset);
    stroke.push(ray.thickness, particleSystem.CONFIG.strokeCap, particleSystem.CONFIG.feather);
    relTime.push(ray.relTime);
  }

  return {
            count: numRays, // number of instances
            attributes: {        
                fillColor: new Float32Array(fillColor), // RGB normalized to [0,1]
                linePointA: new Float32Array(linePointA),
                linePointB: new Float32Array(linePointB),
                resolution: repeat([1920,1080],numRays), // canvas resolution
                offsetStart: new Float32Array(offsetStart),
                offsetEnd: new Float32Array(offsetEnd),
                amplitude: repeat(particleSystem.CONFIG.amplitude, numRays),
                frequency: repeat(particleSystem.CONFIG.frequency, numRays),
                perspectiveSkew: repeat(particleSystem.CONFIG.perspectiveSkew, numRays),
                distortType: repeat(getDistortType(particleSystem.CONFIG.pattern),numRays,{type:"uint32"}), 
                phaseOffset: new Float32Array(phaseOffset),
                relTime: new Float32Array(relTime), // relative time for each ray
                stroke: new Float32Array(stroke), // thickness and cap and feather
                
            },
            blendMode: particleSystem.CONFIG.blendMode === "additive" ? "add" : "regular"
        }
}

export default circleObject;