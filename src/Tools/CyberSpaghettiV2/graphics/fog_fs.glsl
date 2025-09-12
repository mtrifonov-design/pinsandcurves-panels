#include "../../../LibrariesAndUtils/lygia/generative/fbm.glsl"

in vec2 uv;
void main() {
    float fog = fbm(vec3(uv * 1., playheadPosition / 10.)) * 0.5 + 0.5;
    outColor = texture(src, vec2(fog,0.5));
    outColor = texture(src, vec2(0.0,0.0));
    //outColor = vec4(1.,0.,0.,1.);
}