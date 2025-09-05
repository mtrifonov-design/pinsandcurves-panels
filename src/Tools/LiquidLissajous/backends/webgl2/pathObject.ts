import pathVS from "./shaders/pathVS.glsl";
import pathFS from "./shaders/pathFS.glsl";

// const lineVS = `#version 300 es
// in vec2 a_pos;           // quad corner (-1..1)
// in vec3 a_start;         // start point in clip-space (x, y, z)
// in vec3 a_end;           // end point in clip-space (x, y, z)
// in vec3 strokeColor;     // per-instance RGB (always white)
// in float thickness;      // line thickness in clip-space
// out vec2 v_local;        // local quad position
// out vec2 v_dir;          // direction of the line
// out vec3 v_color;
// out float v_z;
// void main() {
//   v_color = strokeColor;
//   v_local = a_pos;
//   vec2 dir = a_end.xy - a_start.xy;
//   float len = length(dir);
//   vec2 dirNorm = dir / len;
//   vec2 normal = vec2(-dirNorm.y, dirNorm.x);

//   // Interpolate z along the line
//   float t = a_pos.x * 0.5 + 0.5; // from 0 (start) to 1 (end)

//   float startZ = a_start.z;
//   float endZ = a_end.z;
//   float z = mix(startZ, endZ, t);

//   // Extrude along normal by a_pos.y * thickness * 0.5, and along direction by a_pos.x * len * 0.5
//   vec2 pos2d = mix(a_start.xy, a_end.xy, 0.5) + dirNorm * (a_pos.x * len * 0.5) + normal * (a_pos.y * thickness * 0.5);
//   v_z = z * 0.5 + 0.5; // normalize z to [0, 1] for depth

//   v_dir = dirNorm;
//   gl_Position = vec4(pos2d, -z * 0.9, 1.0);
// }`;

// // Fragment shader for white stroke
// const lineFS = `#version 300 es
// precision highp float;
// in vec2 v_local;
// in vec2 v_dir;
// in vec3 v_color;
// in float v_z; // interpolated z value
// out vec4 outColor;
// void main() {
//   // v_local.y is -1..1 across the thickness
//   float dist = abs(v_local.y);
//   float alpha = smoothstep(1.0, 0.7, dist); // light falloff at the edge
//   float adjZ = v_z; 
//   alpha *= (0.3 + 0.7 * adjZ);
//   vec3 tcol = mix(vec3(0.2,0.2,1.), vec3(1.0,0.2,0.2),adjZ);
//   vec3 col = mix(vec3(1.0), tcol, dist);
//   outColor = vec4(col, alpha);
// }`;

const pathObject = {
  name: "path",
  instanceAttributes: [
    { name: "a_start", size: 3 },
    { name: "a_end", size: 3 },
    { name: "strokeColor", size: 3 },
    { name: "thickness", size: 1 },
  ],
  vertexShader: pathVS,
  fragmentShader: pathFS,
};

// Define a minimal type for particleSystem
interface ParticleSystemWithPath {
  WIDTH: number;
  HEIGHT: number;
  LISSAJOUS_PATH: Array<[number,number]>;
}

export function pathDraw(particleSystem: ParticleSystemWithPath) {
  // lissajousPath is expected to be an array of {x, y} points
  const path = particleSystem.LISSAJOUS_PATH;
  if (!path || path.length < 2) {
    return { count: 0, attributes: {} };
  }
  const startArr = [];
  const endArr = [];
  const colorArr = [];
  const thicknessArr = [];
  const thickness = 0.015; // in clip-space units, adjust as needed
  for (let i = 0; i < path.length - 1; i++) {
    // Map to clip space (-1..1)
    const [x0,y0,z0] = path[i];
    const [x1,y1,z1] = path[i + 1];
    startArr.push(x0, y0, z0);
    endArr.push(x1, y1, z1);
    colorArr.push(1, 1, 1); // white stroke
    thicknessArr.push(thickness);
  }
  return {
    count: path.length - 1, // number of line segments
    attributes: {
      a_start: new Float32Array(startArr),
      a_end: new Float32Array(endArr),
      strokeColor: new Float32Array(colorArr),
      thickness: new Float32Array(thicknessArr),
    },
  };
}

export default pathObject;