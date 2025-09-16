#include "../../../LibrariesAndUtils/lygia/generative/fbm.glsl"

in vec2 uv;
void main() {
    float fog = fbm(vec3(uv * 1., playheadPosition / 50.)) * 0.5 + 0.5;
    vec3 col = texture(src, vec2(fog,0.5)).rgb * temperature * 0.25;
    outColor = vec4(col, 1.0);
    outColor = texture(src, uv); // + vec4(2.5,2.5,2.5,1.);
    //outColor = vec4(0.,0.,0.,1.);
}