//#include "../../../../LibrariesAndUtils/lygia/generative/fbm.glsl"

// in vec2 uv;
// void main() {

//     //float fog = fbm(vec3(uv * 1., playheadPosition / 50.)) * 0.5 + 0.5;
//     vec3 col = texture(colorTex, (uv / 2.) + vec2(0.5)).rgb;
//     // // outColor = vec4(col * sqrt(texture(src,uv).r) + highlights, texture(src,uv).a) * showUI;
//     col += vec3(0.5);

//     // float vertFade = 1.; //smoothstep(0., 0.1, uv.y * uv.y);
//     // vec3 grad = ((uv.x * uv.x) * 0.5 + 0.5) * col;
//     // outColor = vec4((grad * 1.) * vertFade,1.) * showUI;

//     // float l = length(uv);
//     // float val = smoothstep(0.9,1.0,1.);
//     // outColor = vec4(val,val,val,1.0);
//     outColor = vec4(1.0,0.,0.,1.);
// }


in vec2 uv;                    // assumed in [0,1] from your VS
in float pos;

vec2  uCenter = vec2(0.0);     // brush center in UV (0..1)
float uRadius = 1.;            // brush radius in UV units
float uFeatherPx = 0.;         // edge blur in *pixels*

// --- HARD-CODED COLORS (added) ---


void main() {
        //float fog = fbm(vec3(vec2(uv.x,pos), playheadPosition / 50.)) * 0.5 + 0.5;
        vec3 col = texture(colorTex, vec2(pos,0.)).rgb;
        vec3 COLOR_MID = col;
        vec3 COLOR_INNER   = vec3(0.,0.,0.);
    // // outColor = vec4(col * sqrt(texture(src,uv).r) + highlights, texture(src,uv).a) * showUI;
    col += vec3(0.5);
  //distance in UV and pixel-correct feather
  vec2  uViewport = canvas;
  vec2  dUV   = uv - uCenter;
  float r     = length(dUV);
  float px2uv = 2.0 / min(uViewport.x, uViewport.y); // ~pixels→uv
  float feather = max(uFeatherPx * px2uv, 1e-5);

  // radial alpha with derivative AA + extra feather
  float a = 1.0 - smoothstep(uRadius - feather, uRadius + feather, r);
  if (a <= 0.0) { discard; }

  // gradient t from center (0) to inner edge (1)
  float t = uv.x * uv.x;


  vec3 base = mix(COLOR_INNER, COLOR_MID, t);
    outColor = vec4(base,a);
}
