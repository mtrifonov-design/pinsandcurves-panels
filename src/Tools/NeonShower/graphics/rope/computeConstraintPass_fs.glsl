#include "../minRadius.glsl";


float restLength = 0.01;     // ropeRestLength / (N - 1)
float omega = 1.;          // 1.0 = plain Jacobi, 1.2–1.6 = over-relax
float kLR = 0.2;            // 0..0.35 optional long-range nudge; 0 to disable
in vec2 uv;
vec3 endPos = vec3(5.0, -16.0, -30.0);
void main() {
    vec3 o_point = origin.xyz;
  o_point.z = mix(-10.,-28.,origin.z);
  o_point.xy = origin.xy * 2. - vec2(1.);
  o_point.xy *= minRadius(o_point.z, 45.0, canvas.x/canvas.y);
  o_point.y -= 3.2;

  int W = textureSize(src, 0).x;
  float texel = 1.0 / float(W);
  int i = clamp(int(floor(uv.x * float(W))), 0, W-1);
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

  float maxStep = restLength; // or 0.5*restLength
  float m = length(corr);
  if (m > maxStep) corr *= (maxStep / (m + 1e-6));
  p += omega * corr;

  if (i == 0)      p = o_point;
  if (i == W - 1)  p = endPos;

  outColor = vec4(p, 1.0);
}
