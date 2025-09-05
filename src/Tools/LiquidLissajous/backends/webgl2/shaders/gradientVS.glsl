#version 300 es
in  vec2 a_pos;
in float particleCount;  // number of particles
in float width;         // width of the texture
in float height;        // height of the texture
in float time;
in vec3 backgroundColor;

in float slice;
in float e_factor;

in vec3 noise;
in vec3 fluidWarp;
out vec3 v_noise;
out vec3 v_fluidWarp;
out vec2 v_uv;
out float v_particleCount;
out vec3 v_backgroundColor; // pass to FS
out float v_width;       // pass to FS
out float v_height;      // pass to FS
out float v_time;

out float v_slice;
out float v_e_factor;

void main() {
  v_uv = a_pos;          // 0‥1
v_particleCount = particleCount;   // pass to FS    
  gl_Position = vec4(a_pos, 0.0, 1.0);
    v_width = width;      // pass to FS
    v_height = height;    // pass to FS
    v_noise = noise;
    v_fluidWarp = fluidWarp;

    v_time = time;
    v_backgroundColor = backgroundColor; // pass to FS

    v_slice = slice;      
    v_e_factor = e_factor; 
}