
float restLength = 0.1;     // ropeRestLength / (N - 1)
float omega = 1.0;          // 1.0 = plain Jacobi, 1.2–1.6 = over-relax
float kLR = 0.;            // 0..0.35 optional long-range nudge; 0 to disable
in vec2 uv;
void main() {
  int W = textureSize(src, 0).x;
  float texel = 1.0 / float(W);
  int i = int(floor(uv.x * float(W)));
  float u  = (float(i) + 0.5) * texel;

  vec3 p = texture(src, vec2(u, 0.5)).xyz;
  vec3 corr = vec3(0.0);
  const float eps = 1e-6;

  if (i > 0) {
    float uL = (float(i-1) + 0.5) * texel;
    vec3 pL = texture(src, vec2(uL, 0.5)).xyz;
    vec3 d  = p - pL;
    float len = length(d) + eps;
    vec3 n  = d / len;
    vec3 c  = (len - restLength) * n;   // edge correction
    corr   -= 0.5 * c;                  // move *self* by half
  }
  if (i < W - 1) {
    float uR = (float(i+1) + 0.5) * texel;
    vec3 pR = texture(src, vec2(uR, 0.5)).xyz;
    vec3 d  = p - pR;
    float len = length(d) + eps;
    vec3 n  = d / len;
    vec3 c  = (len - restLength) * n;
    corr   -= 0.5 * c;
  }

  p += omega * corr;

  // Optional long-range nudge to tighten long ropes in 1 pass:
  if (kLR > 0.0) {
    float t = float(i) / float(W - 1);
    vec3 phat = mix(startPos, endPos, t);
    p += kLR * (phat - p);
  }

  if (i == 0)      p = startPos;
  if (i == W - 1)  p = endPos;

  outColor = vec4(p, 1.0);
}
