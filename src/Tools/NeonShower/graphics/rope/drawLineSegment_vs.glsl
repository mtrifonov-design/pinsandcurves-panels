#include "../projection_rotation_translation.glsl";
float uHalfWidth = 0.18;             // half thickness of the ribbon (in world units)
float uHalfLengthScale = 20.;       // scales along the tangent (e.g. 0.5 makes each quad span ~half a segment)

// If you want to clamp how long each quad is relative to neighbor distance:
float uMaxHalfLength = 1.0;         // optional cap (set large if you don't want a cap)

out vec2 uv;
out float pos;
void main() {
    vec2 aPos = position;
    uv = position;
  // Figure out how many particles we have (texture width).
  int W = textureSize(data, 0).x;
  int i = clamp(gl_InstanceID, 0, max(W - 1, 0));

  pos = float(i) / float(W);

  // Helper to safely pick the neighbor index.
  int j = (i < W - 1) ? (i + 1) : max(i - 1, 0);

  // Fetch positions (texelFetch = integer texel coords, ignores filtering).
  vec3 Pi = texelFetch(data, ivec2(i, 0), 0).xyz;
  vec3 Pj = texelFetch(data, ivec2(j, 0), 0).xyz;

  // Tangent in XY (2D rope). If you’re in 3D, build a proper frame instead.
  vec2 t = Pj.xy - Pi.xy;
  float L = length(t);
  vec2 tangent = (L > 1e-8) ? (t / L) : vec2(1.0, 0.0);
  vec2 normal  = vec2(-tangent.y, tangent.x);

  // Choose how far the quad extends along the rope from its center:
  float halfLen = min(uHalfLengthScale * L * 0.5, uMaxHalfLength);

  // Local quad -> world offset in XY, long axis along 'tangent'
  vec2 offsetXY = normal  * (aPos.x * uHalfWidth) +
                  tangent * (aPos.y * uHalfWidth);

  vec3 worldPos = vec3(Pi.xy + offsetXY, Pi.z);

  mat4 p = perspective_projection(canvas.x/canvas.y, 45.0, 0.01, 100.0);
  gl_Position = p * vec4(worldPos, 1.0);
}

