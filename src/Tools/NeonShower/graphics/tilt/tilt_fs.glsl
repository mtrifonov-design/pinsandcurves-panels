#include "./data_texture_helpers.glsl";
#include "./spring_physics.glsl";

float uDeltaTime      = 1.0/60.0;
float uAngularFrequency = 5.0;
float uDampingRatio     = 0.6;

int idx(vec2 uv) { return int(floor(uv.x * 100.)); }
in vec2 uv;
void main() {
    vec4 slot = vec4(0.,0.,0.,0.);
    float equilibrium = 0.;
    float lastVal = 0.;
    if (idx(uv) == 0) {
        slot = readSlot(0,src);
        lastVal = origin.x;
        equilibrium = (origin.x - slot.z) / uDeltaTime;
    }
    if (idx(uv) == 1) {
        slot = readSlot(1,src);
        lastVal = origin.y;
        equilibrium = (origin.y - slot.z) / uDeltaTime;
    }
    if (idx(uv) > 1) {
        discard;
    }

    float pos = slot.x;
    float vel = slot.y;

    //float uEquilibrium = (equilibrium - 0.5) * 2.;
    float uEquilibrium = equilibrium * 0.5;

    // 2) compute motion params for this frame
    tDampedSpringMotionParams P;
    CalcDampedSpringMotionParams(P, uDeltaTime, uAngularFrequency, uDampingRatio);

    // 3) advance the spring
    UpdateDampedSpringMotion(pos, vel, uEquilibrium, P);

    // 4) write next state
    outColor = vec4(pos,vel,lastVal,1.);
}
