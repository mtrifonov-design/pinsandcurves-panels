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

#include "/src/lygia/color/space/oklab2rgb.glsl"
#include "/src/lygia/filter/gaussianBlur/2D.glsl"
#include "/src/lygia/color/space/rgb2hsl.glsl"

const int STRIDE  = 7;

float fetch(int index) {             // helper to fetch RED float
  return texelFetch(u_dyn, ivec2(index, 0), 0).r;
}

vec4 getColor(vec3 p) {
    int PCOUNT = int(v_particleCount); // number of particles
    float wTotal = 0.0;
    float u_r = 0.0;
    float u_g = 0.0;
    float u_b = 0.0;
    bool needsNormalization = true;
    for (int i = 0; i < PCOUNT; ++i) {
        int base = i * STRIDE;
        vec3 center = vec3(fetch(base), fetch(base + 1), fetch(base+2));
        vec3 p_adj = p * vec3(1.,1.,2.5);
        vec3 center_adj = center * vec3(1.,1.,2.5);
        float distance = sqrt(dot(p_adj - center_adj, p_adj - center_adj));
        float r = fetch(base + 3);
        float g = fetch(base + 4);
        float b = fetch(base + 5);
        if (distance < 0.01) {
            u_r = r;
            u_g = g;
            u_b = b;
            needsNormalization = false; 
            break;
        } else {
            float w = 1. / pow((distance), 1.5 + v_slice * 3.);
            wTotal += w;
            u_r += r * w;
            u_g += g * w;
            u_b += b * w;
        }
    }
    
    if (needsNormalization && wTotal > 0.0) {
        u_r /= wTotal;
        u_g /= wTotal;
        u_b /= wTotal;
    }

    return vec4(u_r, u_g, u_b, 1.0); 
}

void main() {

    vec2 uv = v_uv;
    int PCOUNT = int(v_particleCount); 
    vec2 pixelDirection = vec2(0.05);
    const int kernelSize = 9;
    vec4 blurred = gaussianBlur2D(u_depth_field, (uv + 1.0) / 2.0, pixelDirection, kernelSize);
    float depthField = blurred.r; // use the blurred depth field
    vec3 bgColor = v_backgroundColor; // background color
    float d = depthField * 2. - 1.;
    outColor = getColor(vec3(v_uv, d)); 

    //outColor = vec4(getColor(vec3(uv, v_slice * 2. - 1.)).rgb, 1.);
    //outColor = vec4(vec3(depthField), 1.0); 
    outColor = oklab2rgb(outColor);
}