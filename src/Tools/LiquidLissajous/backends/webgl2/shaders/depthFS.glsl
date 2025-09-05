#version 300 es
precision highp float;
uniform sampler2D u_dyn;
uniform sampler2D u_depth_field;
in  float v_width;        // width of the texture
in float v_height;       // height of the texture
in  vec2 v_uv;
in  float v_particleCount; // number of particles
out vec4 outColor;

in float v_slice;        
in float v_e_factor;     

const int STRIDE  = 7;

float fetch(int index) {             // helper to fetch RED float
  return texelFetch(u_dyn, ivec2(index, 0), 0).r;
}
void main() {

    vec2 uv = v_uv;
    int PCOUNT = int(v_particleCount); // number of particles

    float sum = 0.0;
    float weightSum = 0.0;
    float sigma2 = 0.1; // controls the falloff distance
    float heightPower = 1. + 10.0; // controls the emphasis on height

    for (int i = 0; i < PCOUNT; ++i) {
        int base = i * STRIDE;
        vec3 point = vec3(fetch(base), fetch(base + 1), fetch(base + 2)); 
        vec2 delta = uv - point.xy;
        float r2 = dot(delta, delta);
        float w = exp(-r2 / sigma2);
        float z = (point.z  + 1.) / 2.;
        float h = pow(z, heightPower); 
        sum += w * h;
        weightSum += w;
    }
    float result = pow(sum / weightSum, 1.0 / heightPower);
    outColor = vec4(vec3(result),1.0);
}