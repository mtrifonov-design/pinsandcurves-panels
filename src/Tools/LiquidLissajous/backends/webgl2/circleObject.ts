import { resolveLygia } from "./resolveLygia";
import circleVS from "./shaders/circleVS.glsl";
import circleFS from "./shaders/circleFS.glsl";


// const circleVS = `#version 300 es
// in  vec2 a_pos;          // quad corner (-1..1)
// in  vec3 offset;         // instance centre in clip-space
// in  float radius;        // instance radius (clip-space)
// in  vec3 fillColor;      // per-instance RGB
// in  vec2 resolution;     // instance resolution (not used, but required)
// out vec2 v_local;        // coord inside quad (-1..1)
// out vec3 v_color;
// out float v_z;
// void main() {
//   v_local = a_pos;
//   v_color = fillColor;
//   float aspect = resolution.x / resolution.y; // aspect ratio
//   v_z = offset.z * 0.5 + 0.5;
//   gl_Position = vec4(a_pos * vec2(radius, radius * aspect) + offset.xy, -offset.z * 0.9 - 0.03, 1.0);
// }`;

// const circleFS = (`#version 300 es
// precision highp float;
// #include "lygia/color/space/oklab2rgb.glsl"
// in  vec2 v_local;
// in  vec3 v_color;
// in  float v_z; // interpolated z value
// out vec4 outColor;
// void main() {
//   float alpha = 1.;

//   if (length(v_local) > 1.0) discard;  // keep circular footprint
//   if (length(v_local) > 0.8) {
//   outColor = vec4(vec3(1.0),alpha); return;
//   }  // keep circular footprint
//   else outColor = vec4(v_color, alpha);

//   outColor = oklab2rgb(outColor); // convert to RGB
// }`);

const circleObject = {
            name: "circle",
            instanceAttributes: [
                { name: "offset", size: 3 },
                { name: "radius", size: 1 },
                { name: "resolution", size: 2 },
                { name: "fillColor", size: 3 },
            ],
            vertexShader: circleVS,
            fragmentShader: circleFS,
        }

export function circleDraw(particleSystem) {

  const offsetArr = [];
  const radiusArr = [];
  const colorArr = [];
  const resArr = [];
  particleSystem.PARTICLES.forEach(particle => {
    const { x, y, z, r, g, b } = particle;
    offsetArr.push(x); // map to -1..1
    offsetArr.push(y); // map to -1..1
    offsetArr.push(z); // map to -1..1
    const pixelRadius = 12;
    const radius = (pixelRadius*2) / (particleSystem.WIDTH); // map to -1..1
    radiusArr.push(radius); // fixed radius
    colorArr.push(r,g,b); // RGB color
    resArr.push(particleSystem.WIDTH, particleSystem.HEIGHT); // resolution (not used, but required)
  });
  return {
            count: particleSystem.PARTICLES.length, // number of instances
            attributes: {
                /* instance 0 then 1 … */
                offset: new Float32Array(offsetArr),  // centers
                radius: new Float32Array(radiusArr),               // sizes
                fillColor: new Float32Array(colorArr), // blue, red
                resolution: new Float32Array(resArr), // resolution (not used, but required)
            },
        }
}

export default circleObject;