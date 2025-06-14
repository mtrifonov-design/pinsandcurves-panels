const circleVS = `#version 300 es
in vec2 a_pos;          // quad corner (-1..1)
in vec2 offset;         // instance centre in clip-space
in float radius;        // instance radius (clip-space)
in vec3 fillColor;      // per-instance RGB
in float thickness;    // per-instance thickness
in float balance;       // per-instance balance (0 = extremes, 1 = equal)
in vec2 resolution;     // instance resolution (not used, but required)
in vec2 linePointA;     // start of the line
in vec2 linePointB;     // end of the line
in float feather;
out vec2 v_local;        // coord inside quad (-1..1)
out vec3 v_color;
out float v_balance;     // balance parameter
out float v_thickness;   // thickness parameter
out float v_feather;     // feather parameter
out float v_length; // length of the line segment
void main() {
  // Compute line direction and perpendicular
  vec2 lA = linePointA;
  vec2 lB = linePointB;
  vec2 dir = lB - lA;
  float len = length(dir);
  vec2 dirN = dir / len;
  vec2 perp = vec2(-dirN.y, dirN.x);
  float halfWidth = 0.3; // extrusion amount

  // Map a_pos.x in [-1,1] to [0,len] along the line
  // Map a_pos.y in [-1,1] to [-halfWidth, halfWidth] perpendicular
  float along = (a_pos.x * 0.5 + 0.5) * len;
  float side = a_pos.y * halfWidth;
  vec2 pos = lA + dirN * along + perp * side;

  // Adjust v_local so that circles stay circles in fragment shader
  // v_local.x in [0,len], v_local.y in [-halfWidth, halfWidth]
  // Normalize so that v_local.x in [0,1] (relative to line), v_local.y in [-1,1] (relative to width)
  v_local = vec2((along / len) * 2. - 1., a_pos.y);
  v_length = len; // pass length to fragment shader

  v_color = fillColor;
  v_balance = balance;
  v_thickness = thickness;
  v_feather = feather;

  float aspect = resolution.x / resolution.y; // aspect ratio
  gl_Position = vec4(pos * vec2(1.0, aspect) + offset, 0.0, 1.0);
}`;

const circleFS = `#version 300 es
precision highp float;
in  vec2 v_local;
in  vec3 v_color;
in float v_length; // length of the line segment
in float v_balance; // balance parameter
in float v_thickness; // thickness parameter
in float v_feather; // feather parameter
out vec4 outColor;

// Toggle bounding box display
const bool showBoundingBox = true;

// Helper to compute radii based on balance
void getCapsuleRadii(out float rA, out float rB, float balance) {
    float rMin = 0.01;
    float rMax = 0.3;
    float rAvg = 0.5 * (rMin + rMax);
    rA = mix(rMin, rAvg, balance);
    rB = mix(rMax, rAvg, balance);
}

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
vec2 distortRay(vec2 p, float amplitude, float frequency, float phase, int type, float balance) {
    float x = p.x;
    float y = p.y;
    // Modulate amplitude by balance: balance=1 → full amplitude, balance=0 → amplitude ramps from 0 to full
    float t = (x + 1.0) * 0.5; // map x from [-1,1] to [0,1]

    // Modulate phase nonlinearly for perspective effect
    float phaseT = freqModulate(1.-t,1.+(1.-balance) * 5.) + phase; // nonlinear phase adjustment based on balance; 
    float ampMod = mix(t*t,1.,balance*balance); // x in [-1,1], so x*x ramps from 0 to 1 at ends
    float localAmp = amplitude * ampMod;
    float offset = 0.0;
    if (type == 0) {
        // Sine
        offset = localAmp * sin(phaseT * frequency);
    } else if (type == 1) {
        // Zigzag (triangle wave)
        float tri = abs(fract(phaseT / 3.14159265359) * 2.0 - 1.0) * 2.0 - 1.0;
        offset = localAmp * tri;
    } else if (type == 2) {
        // Electric (randomized jagged)
        float s = sin(phaseT) * sin(3.7 * phaseT + 1.3) * sin(7.3 * phaseT + 2.1);
        offset = localAmp * s;
    }
    return vec2(x, y + offset);
}

void main() {
  // Compute radii based on balance
  float rA, rB;
  getCapsuleRadii(rA, rB, v_balance);
  rA = rA * v_thickness;
  rB = rB * v_thickness;

  // Normalize x so circles stay circles regardless of v_length
  float aspect = v_length / 2.0;
  vec2 p = v_local;

  // Distortion parameters (could be uniforms or varyings in future)
  float amplitude = 0.8;
  float frequency = 18.0;
  float phase = 0.0;
  int type = 2; // 0 = sine, 1 = zigzag, 2 = electric

  // Apply distortion to the normalized coordinates, modulated by balance
  vec2 p_distorted = distortRay(p, amplitude, frequency, phase, type, v_balance);
  float d = sdUnevenCapsuleNorm(p_distorted, vec3((-1. + rA), 0.0, rA), vec3((1. - rB), 0.0, rB));

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
  float alpha = 1.0 - smoothstep(-sqrt(v_feather), 0.0, d);
  if (alpha <= 0.0) discard;
  outColor = vec4(v_color, alpha);
}`;

const circleObject = {
            name: "circle",
            instanceAttributes: [
                { name: "offset", size: 2 },
                { name: "thickness", size: 1 },
                { name: "balance", size: 1 },
                { name: "feather", size: 1 },
                { name: "linePointA", size: 2},
                { name: "linePointB", size: 2},
                { name: "fillColor", size: 3 },
                { name: "resolution", size: 2 },
            ],
            vertexShader: circleVS,
            fragmentShader: circleFS,
        }

export function circleDraw() {
  return {
            count: 1, // number of instances
            attributes: {
                /* instance 0 then 1 … */
                offset: new Float32Array([0.,0.]),  
                thickness: new Float32Array([0.5]),              
                fillColor: new Float32Array([1.,0.,1.,]),
                balance: new Float32Array([0.2]),
                feather: new Float32Array([0.8]),
                linePointA: new Float32Array([0., 0.]),
                linePointB: new Float32Array([.5, .5]),
                resolution: new Float32Array([1920, 1080]), // canvas resolution
            },
        }
}

export default circleObject;