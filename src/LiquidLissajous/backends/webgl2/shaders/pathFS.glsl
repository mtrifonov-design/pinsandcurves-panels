#version 300 es
precision highp float;
in vec2 v_local;
in vec2 v_dir;
in vec3 v_color;
in float v_z; // interpolated z value
out vec4 outColor;
void main() {
  // v_local.y is -1..1 across the thickness
  float dist = abs(v_local.y);
  float alpha = smoothstep(1.0, 0.7, dist); // light falloff at the edge
  float adjZ = v_z; 
  alpha *= (0.3 + 0.7 * adjZ);
  vec3 tcol = mix(vec3(0.2,0.2,1.), vec3(1.0,0.2,0.2),adjZ);
  vec3 col = mix(vec3(1.0), tcol, dist);
  outColor = vec4(col, alpha);
}