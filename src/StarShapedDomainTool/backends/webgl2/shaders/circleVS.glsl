#version 300 es
in  vec2 a_pos;          // quad corner (-1..1)
in  vec3 offset;         // instance centre in clip-space
in  float radius;        // instance radius (clip-space)
in  vec3 fillColor;      // per-instance RGB
in  vec2 resolution;     // instance resolution (not used, but required)
out vec2 v_local;        // coord inside quad (-1..1)
out vec3 v_color;
out float v_z;
void main() {
  v_local = a_pos;
  v_color = fillColor;
  float aspect = resolution.x / resolution.y; // aspect ratio
  v_z = offset.z * 0.5 + 0.5;
  gl_Position = vec4(a_pos * vec2(radius, radius * aspect) + offset.xy, -offset.z * 0.9 - 0.03, 1.0);
}