#version 300 es
precision highp float;
#include "/src/lygia/color/space/oklab2rgb.glsl"
in  vec2 v_local;
in  vec3 v_color;
in  float v_z; // interpolated z value
out vec4 outColor;
void main() {
  float alpha = 1.;

  if (length(v_local) > 1.0) discard;  // keep circular footprint
  if (length(v_local) > 0.8) {
  outColor = vec4(vec3(1.0),alpha); return;
  }  // keep circular footprint
  else outColor = vec4(v_color, alpha);

  outColor = oklab2rgb(outColor); // convert to RGB
}