vec3 endPos = vec3(0.,0.,0.);
float dt = 1. / 60.;         // e.g. 1.0/60.0
float damping = 0.98;    // 0.98–0.995
vec3 gravity = vec3(0.,-2.,0.);     // e.g. vec3(0.0,-9.8,0.0) in your units
in vec2 uv;
void main() {
  int W = textureSize(curPosTex, 0).x;
  float texel = 1.0 / float(W);
  int i = int(floor(uv.x * float(W)));
  float u = (float(i) + 0.5) * texel;

  vec3 pPrev = texture(curPosTex, vec2(u, 0.5)).xyz;   // or lastPosTex, depending on how you rotate
  vec3 pCur  = texture(lastPosTex, vec2(u, 0.5)).xyz;  // swap if needed: {last,cur} naming is ambiguous

  vec3 v     = (pCur - pPrev) * damping;
  vec3 pNew  = pCur + v + gravity * (dt * dt);

  if (i == 0)      pNew = origin.xyz;
  if (i == W - 1)  pNew = endPos;

  outColor = vec4(pNew, 1.0);
}
