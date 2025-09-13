



// Optional tuning (will fall back to defaults if left at 0):
float uDeltaTime = 10. / 60.0;          // seconds; default 1.0/60.0 if 0
float uAngularFrequency = 10.0;   // rad/s;  default 10.0 if 0
float uDampingRatio = 0.7;       // zeta;   default 0.7 if 0
float uTiltGain = 0.02;           // maps velocity to equilibrium tilt; default 0.02

// ---------------------------------------------
// Texture helpers (100x1 layout)
// ---------------------------------------------
vec2 texSize() {
    return vec2(textureSize(src, 0));
}
float widthF() { return texSize().x; }

vec2 uvForIndex(int i) {
    // sample center of texel i on row 0
    float u = (float(i) + 0.5) / widthF();
    return vec2(u, 0.5); // 1-pixel-tall strip
}
vec4 readSlot(int i) { return texture(src, uvForIndex(i)); }

// ---------------------------------------------
// Safe getters for uniforms with defaults
// ---------------------------------------------
float getDT() {
    float dt = uDeltaTime;
    if (dt <= 0.0) dt = 1.0/60.0;
    return max(dt, 1e-6);
}
float getOmega() {
    float w = uAngularFrequency;
    if (w <= 0.0) w = 10.0;
    return max(w, 1e-6);
}
float getZeta() {
    float z = uDampingRatio;
    if (z < 0.0) z = 0.0;
    return z;
}
float getTiltGain() {
    float g = uTiltGain;
    if (g <= 0.0) g = 0.02;
    return g;
}

// ---------------------------------------------
// Damped spring coefficient computation (C → GLSL)
// Returns (posPos, posVel, velPos, velVel)
// ---------------------------------------------
vec4 calcDampedSpringCoeffs(float dt, float omega, float zeta) {
    const float epsilon = 1e-4;

    if (omega < epsilon) {
        return vec4(1.0, 0.0, 0.0, 1.0);
    }

    if (zeta > 1.0 + epsilon) {
        // over-damped
        float za = -omega * zeta;
        float zb =  omega * sqrt(zeta*zeta - 1.0);
        float z1 = za - zb;
        float z2 = za + zb;

        float e1 = exp(z1 * dt);
        float e2 = exp(z2 * dt);

        float invTwoZb = 1.0 / (2.0 * zb); // 1/(z2 - z1)

        float e1_Over_TwoZb = e1 * invTwoZb;
        float e2_Over_TwoZb = e2 * invTwoZb;

        float z1e1_Over_TwoZb = z1 * e1_Over_TwoZb;
        float z2e2_Over_TwoZb = z2 * e2_Over_TwoZb;

        float posPos =  e1_Over_TwoZb * z2 - z2e2_Over_TwoZb + e2;
        float posVel = -e1_Over_TwoZb + e2_Over_TwoZb;

        float velPos = (z1e1_Over_TwoZb - z2e2_Over_TwoZb + e2) * z2;
        float velVel = -z1e1_Over_TwoZb + z2e2_Over_TwoZb;

        return vec4(posPos, posVel, velPos, velVel);
    } else if (zeta < 1.0 - epsilon) {
        // under-damped
        float omegaZeta = omega * zeta;
        float alpha     = omega * sqrt(1.0 - zeta*zeta);

        float expTerm = exp(-omegaZeta * dt);
        float cosTerm = cos(alpha * dt);
        float sinTerm = sin(alpha * dt);

        float invAlpha = 1.0 / max(alpha, 1e-6);

        float expSin = expTerm * sinTerm;
        float expCos = expTerm * cosTerm;
        float expOmegaZetaSin_Over_Alpha = expTerm * omegaZeta * sinTerm * invAlpha;

        float posPos = expCos + expOmegaZetaSin_Over_Alpha;
        float posVel = expSin * invAlpha;

        float velPos = -expSin * alpha - omegaZeta * expOmegaZetaSin_Over_Alpha;
        float velVel =  expCos - expOmegaZetaSin_Over_Alpha;

        return vec4(posPos, posVel, velPos, velVel);
    } else {
        // critically damped
        float expTerm     = exp(-omega * dt);
        float timeExp     = dt * expTerm;
        float timeExpFreq = timeExp * omega;

        float posPos = timeExpFreq + expTerm;
        float posVel = timeExp;

        float velPos = -omega * timeExpFreq;
        float velVel = -timeExpFreq + expTerm;

        return vec4(posPos, posVel, velPos, velVel);
    }
}

// ---------------------------------------------
// Single-axis spring step
// Given old (pos, vel), target equilibrium, and coeffs,
// returns new (pos, vel).
// ---------------------------------------------
vec2 springStep(float oldPos, float oldVel, float equilibrium, vec4 C) {
    float posPos = C.x, posVel = C.y, velPos = C.z, velVel = C.w;

    float relPos = oldPos - equilibrium; // work in equilibrium-relative space
    float newPos = relPos * posPos + oldVel * posVel + equilibrium;
    float newVel = relPos * velPos + oldVel * velVel;
    return vec2(newPos, newVel);
}

// ---------------------------------------------
// Velocity estimator and target tilt
// ---------------------------------------------
struct Motion {
    vec2 lastPos;
    vec2 vel;
    float speed;
};
Motion estimateMotion(vec2 currentPos, vec2 storedLastPos, float dt) {
    vec2 v = (currentPos - storedLastPos) / dt;
    return Motion(storedLastPos, v, length(v));
}
vec2 targetTilt(vec2 velocity, float gain) {
    // tilt “leans into motion”: equilibrium tilt proportional to velocity
    return gain * velocity;
}

// ---------------------------------------------
// Main
// ---------------------------------------------
void main() {
    // Convert pixel coord to slot index [0, width-1]
    int idx = int(gl_FragCoord.x) - 1;

    // Read prior frame state
    vec4 slot0   = readSlot(0); // lastPos in .rg, previous dt/speed in .ba (optional)
    vec4 slot1   = readSlot(1); // springX state
    vec4 slot2   = readSlot(2); // springY state
    // others are read on-demand

    // Effective parameters
    float dt     = getDT();
    float omega  = getOmega();
    float zeta   = getZeta();
    float gain   = getTiltGain();

    // Estimate motion from lastPos → current uPos
    Motion m = estimateMotion(origin.xy, slot0.rg, dt);
    vec2 eqTilt = targetTilt(m.vel, gain); // per-axis target tilt (equilibrium)

    // Compute damped-spring coefficients
    vec4 coeffs = calcDampedSpringCoeffs(dt, omega, zeta);

    // Advance springs from stored state
    vec2 stateX = springStep(slot1.r, slot1.g, eqTilt.x, coeffs);
    vec2 stateY = springStep(slot2.r, slot2.g, eqTilt.y, coeffs);

    // What should each slot write this frame?
    vec4 outVal;

    if (idx == 0) {
        // Store latest observed position; stash dt and speed for debugging
        outVal = vec4(origin.xy, dt, m.speed);
    } else if (idx == 1) {
        // X-tilt spring state (pos, vel)
        outVal = vec4(stateX, 0.0, 1.0);
    } else if (idx == 2) {
        // Y-tilt spring state (pos, vel)
        outVal = vec4(stateY, 0.0, 1.0);
    } else if (idx == 3) {
        // Coefficients, for inspection/consistency
        outVal = coeffs;
    } else if (idx == 4) {
        // Public outputs for other passes:
        // .r = xTilt, .g = yTilt, .b = speed (optional), .a = 1
        outVal = vec4(stateX.x, stateY.x, m.speed, 1.0);
    } else {
        // Pass-through everything else unchanged
        outVal = readSlot(idx);
    }

    outColor = outVal;
}
