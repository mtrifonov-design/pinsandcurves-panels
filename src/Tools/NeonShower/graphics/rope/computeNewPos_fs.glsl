
#include "../minRadius.glsl";
vec3 endPos = vec3(5.,-10.,-10.);
float dt = 1. / 60.;         // e.g. 1.0/60.0
float damping = 0.5;    // 0.98–0.995
vec3 gravity = vec3(0.,-12.,0.);     // e.g. vec3(0.0,-9.8,0.0) in your units
in vec2 uv;
void main() {
    vec3 o_point = origin.xyz;
  o_point.z = mix(-10.,-28.,origin.z);
  o_point.xy = origin.xy * 2. - vec2(1.);
  o_point.xy *= minRadius(o_point.z, 45.0, canvas.x/canvas.y);
  o_point.y -= 3.4;
  int W = textureSize(curPosTex, 0).x;
  float texel = 1.0 / float(W);
  int i = int(floor(uv.x * float(W)));
  float u = (float(i) + 0.5) * texel;

  vec3 pPrev = texture(lastPosTex, vec2(u, 0.5)).xyz;   // or lastPosTex, depending on how you rotate
  vec3 pCur  = texture(curPosTex, vec2(u, 0.5)).xyz;  // swap if needed: {last,cur} naming is ambiguous

  vec3 v     = (pCur - pPrev) * damping;
  vec3 pNew  = pCur + v + gravity * (dt * dt);

  vec3 pNewOnPole = o_point + vec3(0.,-float(i) * 0.01, 0.);

  if (i == 0)      pNew = o_point;
  if (i == W - 1)  pNew = endPos;
  // if (i < 100) {
  //   pNew = mix(pNewOnPole,pNew, float(i) / float(100));
  // } 
  float x = float(i) / float(W);
  pNew = mix(pNewOnPole,pNew, 1.- pow(1.-x,10.));
  

  outColor = vec4(pNew, 1.0);
}
