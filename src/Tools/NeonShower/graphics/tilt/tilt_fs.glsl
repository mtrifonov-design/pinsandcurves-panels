#include "./data_texture_helpers.glsl";
#include "./spring_physics.glsl";

float uDeltaTime      = 1.0/60.0;
float uAngularFrequency = 10.0;
float uDampingRatio     = 0.1;

int idx() { return int(gl_FragCoord.x); }

void main() {
    vec4 slot = vec4(0.,0.,0.,0.);
    float equilibrium = 0.;
    if (idx() == 0) {
        slot = readSlot(0,src);
        equilibrium = origin.x;
    }
    if (idx() == 1) {
        slot = readSlot(1,src);
        equilibrium = origin.y;
    }
    if (idx() > 1) {
        discard;
    }

    float pos = slot.x;
    float vel = slot.y;

    float uEquilibrium = (equilibrium - 0.5) * 2.;

    // 2) compute motion params for this frame
    tDampedSpringMotionParams P;
    CalcDampedSpringMotionParams(P, uDeltaTime, uAngularFrequency, uDampingRatio);

    // 3) advance the spring
    UpdateDampedSpringMotion(pos, vel, equilibrium, P);

    // 4) write next state
    outColor = vec4(pos,vel,0.,1.);
}
