// depthField.ts
import { ParticleSystem } from './ParticleSystem.js';

/**
 * Produce a depth texture in [0,1] from the current particle set.
 *
 * @param ps             active ParticleSystem (gives us particles + z)
 * @param size           texture resolution (power-of-two keeps GL happy)
 * @param iterations     Gauss-Seidel sweeps for cloth relaxation
 */
export function computeDepthFieldTexture(
  ps: ParticleSystem,
  size = 256,
  iterations = 80
): Float32Array {
  const N = size;
  const len = N * N;

  // Height field (mutable) and obstacle map (fixed “ceilings”).
  const h = new Float32Array(len);
  const obs = new Float32Array(len);           // initialised to 0 everywhere

  // ------------------------------------------------------------
  // 1. Stamp particle peaks into the obstacle map
  // ------------------------------------------------------------
  for (const p of ps.PARTICLES) {
    // map [-1,1] → [0,N-1]     (shader does (uv+1)/2, so invert that)
    const ix = Math.min(N - 1, Math.max(0, Math.floor(((p.x + 1) * 0.5) * (N - 1))));
    const iy = Math.min(N - 1, Math.max(0, Math.floor(((p.y + 1) * 0.5) * (N - 1))));
    const idx = iy * N + ix;
    const zNorm = (p.z + 1) * 0.5;             // [-1,1] → [0,1]
    if (zNorm > obs[idx]) obs[idx] = zNorm;
  }

  // Copy obstacles into the working height field so they are enforced Day-1
  h.set(obs);

  // ------------------------------------------------------------
  // 2. Cloth relaxation with obstacle constraint
  // ------------------------------------------------------------
  for (let it = 0; it < iterations; ++it) {
    let maxDelta = 0;
    for (let y = 1; y < N - 1; ++y) {
      for (let x = 1; x < N - 1; ++x) {
        const i = y * N + x;
        const avg =
          (h[i - 1] + h[i + 1] + h[i - N] + h[i + N]) * 0.25; // 4-neighbour Laplacian
        const newH = Math.max(avg, obs[i]);                   // obstacle projection
        const delta = Math.abs(newH - h[i]);
        maxDelta = delta > maxDelta ? delta : maxDelta;
        h[i] = newH; // store as 0-255
      }
    }
    if (maxDelta < 1e-4) break;                               // early-out if converged
  }

  const hInt = new Uint8Array(len);
  for (let i = 0; i < len; ++i) {
    hInt[i] = Math.floor(h[i] * 255);  // convert to 0-255
  }

  return hInt;  // already in [0,1] , ready for GL_R32F upload
}
