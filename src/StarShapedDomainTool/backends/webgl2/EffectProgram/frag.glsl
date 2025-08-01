out vec4 outColor;
in vec2 v_texCoord;
uniform sampler2D u_texture;

#include "/src/lygia/distort/grain.glsl"

void main() {
    outColor = vec4(texture(u_texture, v_texCoord).rgba);
    if (grainEnabled == 1) {
        float grainVal = grain(v_texCoord,dimensions, time * 50.);
        outColor.xyz += (grainVal - 0.5) * grainIntensity * 0.8;
    }
}