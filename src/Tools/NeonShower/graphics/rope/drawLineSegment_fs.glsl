// //#include "../../../../LibrariesAndUtils/lygia/generative/fbm.glsl"

// in vec2 uv;
// void main() {

//     //float fog = fbm(vec3(uv * 1., playheadPosition / 50.)) * 0.5 + 0.5;
//     vec3 col = texture(colorTex, (uv / 2.) + vec2(0.5)).rgb;
//     // outColor = vec4(col * sqrt(texture(src,uv).r) + highlights, texture(src,uv).a) * showUI;

//     float vertFade = 1.; //smoothstep(0., 0.1, uv.y * uv.y);
//     vec3 grad = ((uv.x * uv.x) * 0.5 + 0.5) * col;
//     outColor = vec4((grad * 1.) * vertFade,1.) * showUI;
// }


in vec2 uv;                    // assumed in [0,1] from your VS


vec2  uCenter = vec2(0.5);         // brush center in UV (0..1)
float uRadius = 1.;         // brush radius in UV units
float uFeatherPx = 0.;      // edge blur in *pixels*


// simple lighting knobs
vec3  uLightDir = normalize(vec3(0.3, 0.6, 1.0));
float uAmbient  = 0.25;
float uSpec     = 0.15;
float uShine    = 32.0;

void main() {
  // distance in UV and pixel-correct feather
  vec2  uViewport = canvas; 
  vec2  dUV   = uv - uCenter;
  float r     = length(dUV);
  float px2uv = 2.0 / min(uViewport.x, uViewport.y);     // ~pixels→uv
  float feather = max(uFeatherPx * px2uv, 1e-5);

  // radial alpha with derivative AA + extra feather
  float a = 1.0 - smoothstep(uRadius - feather, uRadius + feather, r);
  if (a <= 0.0) { discard; }  // or keep alpha if you prefer

  // gradient t from center (0) to inner edge (1)
  float t = clamp(r / max(uRadius - feather, 1e-5), 0.0, 1.0);

  // palette colors at 0.0 and 0.5
  vec3 c0 = texture(colorTex, vec2(0.0, 0.5)).rgb;
  vec3 c1 = texture(colorTex, vec2(0.5, 0.5)).rgb;
  vec3 base = mix(c0, c1, t);

  // fake sphere normal (z from circle equation)
  float nz = sqrt(max(0.0, 1.0 - (r*r) / (uRadius*uRadius + 1e-8)));
  vec3 N = normalize(vec3(dUV / max(uRadius, 1e-5), nz));

  // simple Blinn-Phong
  float ndl = max(dot(N, normalize(uLightDir)), 0.0);
  float diff = mix(uAmbient, 1.0, ndl);
  float spec = pow(max(dot(N, normalize(uLightDir + vec3(0,0,1))), 0.0), uShine) * uSpec;

  vec3 color = base * diff + spec;

  // Straight alpha (use premultiplied if your pipeline expects it)
  outColor = vec4(color, a);
  // For premultiplied alpha: outColor = vec4(color * a, a);
}
