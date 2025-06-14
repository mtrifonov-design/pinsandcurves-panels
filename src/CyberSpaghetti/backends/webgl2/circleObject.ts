const circleVS = `#version 300 es
in  vec2 a_pos;          // quad corner (-1..1)
in  vec2 offset;         // instance centre in clip-space
in  float radius;        // instance radius (clip-space)
in  vec3 fillColor;      // per-instance RGB
in  vec2 resolution;     // instance resolution (not used, but required)
out vec2 v_local;        // coord inside quad (-1..1)
out vec3 v_color;
void main() {
  v_local = a_pos;
  v_color = fillColor;
  float aspect = resolution.x / resolution.y; // aspect ratio
  gl_Position = vec4(a_pos * vec2(radius, radius * aspect) + offset, 0.0, 1.0);
}`;

const circleFS = `#version 300 es
precision highp float;
in  vec2 v_local;
in  vec3 v_color;
out vec4 outColor;

// Toggle bounding box display
const bool showBoundingBox = false;

// Feather parameter for capsule edge softness (0 = hard, 1 = fully feathered)
const float feather = .8;

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

// Signed distance to axis-aligned bounding box centered at origin, size 2x2
float sdBoundingBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  // Example capsule: from (-0.9, 0., 0.1) to (0.7, 0., 0.3)
  vec2 p = v_local * 1.0;
  float d = sdUnevenCapsuleNorm(p, vec3(-0.9, 0., 0.1), vec3(0.7, 0., 0.3));

  // Draw bounding box if enabled
  if (showBoundingBox) {
    float bbox = sdBoundingBox(p, vec2(1.0, 1.0));
    if (abs(bbox) < 0.03) {
      outColor = vec4(1.,1.,1., 1.0); // white outline
      return;
    }
  }

  // Feathered edge logic using normalized SDF and thresholded smoothstep

  float alpha = 1.0 - smoothstep(-sqrt(feather), 0.0, d);;
  if (alpha <= 0.0) discard;
  outColor = vec4(v_color, alpha);
}`;

const circleObject = {
            name: "circle",
            instanceAttributes: [
                { name: "offset", size: 2 },
                { name: "radius", size: 1 },
                { name: "resolution", size: 2 },
                { name: "fillColor", size: 3 },
            ],
            vertexShader: circleVS,
            fragmentShader: circleFS,
        }

export function circleDraw() {
  return {
            count: 1, // number of instances
            attributes: {
                /* instance 0 then 1 … */
                offset: new Float32Array([0.,0.]),  // centers
                radius: new Float32Array([0.2]),               // sizes
                fillColor: new Float32Array([1.,1.,1.,]), // blue, red
                resolution: new Float32Array([1920,1080]), // resolution (not used, but required)
            },
        }
}

export default circleObject;