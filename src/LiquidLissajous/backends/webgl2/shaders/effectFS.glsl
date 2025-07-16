#version 300 es
precision highp float;
uniform sampler2D u_dyn;
uniform sampler2D u_depth_field;
in  float v_width;        // width of the texture
in float v_height;       // height of the texture
in  float v_time;         // time, not used
in  vec2 v_uv;
in vec3 v_backgroundColor; // background color
in vec3 v_noise;
in vec3 v_fluidWarp;
in  float v_particleCount; // number of particles
out vec4 outColor;

in float v_slice;        
in float v_e_factor;     

#include "/src/lygia/distort/grain.glsl"

const int STRIDE  = 7;

float fetch(int index) {             // helper to fetch RED float
  return texelFetch(u_dyn, ivec2(index, 0), 0).r;
}

void main() {
    vec2 uv = v_uv;
    vec4 col = texture(u_depth_field, (v_uv + 1.) / 2.);
    outColor = col;
    float noise = grain(v_uv,vec2(v_width,v_height), v_time * 50.);
    //outColor = vec4(vec3(noise), 1.0);
    outColor.xyz += (noise - 0.5) * v_noise.x * 0.8;
}