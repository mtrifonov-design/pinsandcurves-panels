#version 300 es
in vec2 a_pos;           // quad corner (-1..1)
in vec3 a_start;         // start point in clip-space (x, y, z)
in vec3 a_end;           // end point in clip-space (x, y, z)
in vec3 strokeColor;     // per-instance RGB (always white)
in float thickness;      // line thickness in clip-space
out vec2 v_local;        // local quad position
out vec2 v_dir;          // direction of the line
out vec3 v_color;
out float v_z;
void main() {
  v_color = strokeColor;
  v_local = a_pos;
  vec2 dir = a_end.xy - a_start.xy;
  float len = length(dir);
  vec2 dirNorm = dir / len;
  vec2 normal = vec2(-dirNorm.y, dirNorm.x);

  // Interpolate z along the line
  float t = a_pos.x * 0.5 + 0.5; // from 0 (start) to 1 (end)

  float startZ = a_start.z;
  float endZ = a_end.z;
  float z = mix(startZ, endZ, t);

  // Extrude along normal by a_pos.y * thickness * 0.5, and along direction by a_pos.x * len * 0.5
  vec2 pos2d = mix(a_start.xy, a_end.xy, 0.5) + dirNorm * (a_pos.x * len * 0.5) + normal * (a_pos.y * thickness * 0.5);
  v_z = z * 0.5 + 0.5; // normalize z to [0, 1] for depth

  v_dir = dirNorm;
  gl_Position = vec4(pos2d, -z * 0.9, 1.0);
}