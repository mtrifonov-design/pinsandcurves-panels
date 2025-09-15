#include "../../../../LibrariesAndUtils/lygia/generative/fbm.glsl"

in vec2 uv;
void main() {

    float fog = fbm(vec3(uv * 1., playheadPosition / 50.)) * 0.5 + 0.5;
    vec3 col = texture(colorTex, vec2(fog,0.5)).rgb;
    float highlights = smoothstep(0.6,0.9,uv.x * uv.x);
    // outColor = vec4(col * sqrt(texture(src,uv).r) + highlights, texture(src,uv).a) * showUI;

    float vertFade = smoothstep(0.2, 0.4, uv.y * uv.y);
    vec3 grad = uv.x * uv.x * col;
    outColor = vec4((grad * 1. + vec3(.9) * highlights) * vertFade,1.) * showUI;
}