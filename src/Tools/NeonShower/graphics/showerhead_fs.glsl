#include "../../../LibrariesAndUtils/lygia/generative/fbm.glsl"


//  `
//                 in vec2 uv;
//                 void main() {
//                     outColor = texture(src, uv) * vec4(1.) * 0.85 * showUI;
//                 }
//             `,

in vec2 uv;
void main() {
    float fog = fbm(vec3(uv * 1., playheadPosition / 50.)) * 0.5 + 0.5;
    vec3 col = texture(colorTex, vec2(fog,0.5)).rgb;
    float highlights = pow(texture(src,uv).r,4.0);
    outColor = vec4(col * sqrt(texture(src,uv).r) + highlights, texture(src,uv).a) * showUI;
    //outColor = texture(src, uv) * vec4(1.) * 0.85 * showUI;
    //outColor = texture(src, uv);
    //outColor = vec4(0.,0.,0.,1.);
}