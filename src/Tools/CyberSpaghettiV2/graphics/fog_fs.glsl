#include "../../../LibrariesAndUtils/lygia/generative/fbm.glsl"

in vec2 uv;
void main() {
    vec4 px = texture(src, uv);
    float fog = fbm(vec3(uv * 1., playheadPosition / 10.)) * 0.5 + 0.5;
    outColor = px * fog;
}