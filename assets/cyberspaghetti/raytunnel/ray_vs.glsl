vec3 centerPoint = vec3(0.0,0.0,1.0);
float radius1 = 0.1;
float radius2 = 0.5;

#include "/cyberspaghetti/raytunnel/projection_rotation_translation.glsl";
#include "/cyberspaghetti/raytunnel/randomness.glsl";

float angle = 90.;
//float ray_length = .5;
float ray_length_variation = 0.25;
float ray_progress = .5;
//float ray_thickness = 0.02;
float ray_thickness_variation = .25;
float lifecycle = 120.;


mat4 generateRayPositions(float nCD, float nCR, float fCD, float fCR, float angle, float ray_length, float ray_progress, float ray_thickness, vec3 chaos_vector) {
    vec3 nearPoint = vec3(nCR * sin(radians(angle)), nCR * cos(radians(angle)), nCD);
    fCR += fCR * chaos * chaos_vector.x;
    vec3 farPoint = vec3(fCR * sin(radians(angle)), fCR * cos(radians(angle)), fCD);
    vec3 delta = -(farPoint - nearPoint);
    float ray_full_length = length(delta);
    float computed_progress = ray_progress * (1. + ray_length) - ray_length;
    vec3 rayStart = farPoint + computed_progress * delta;
    vec3 rayEnd = farPoint + (ray_length + computed_progress) * delta;
    vec2 normal = vec2(sin(radians(angle)), cos(radians(angle)));
    vec2 orthogonal_to_normal = vec2(-normal.y, normal.x);
    vec2 o = orthogonal_to_normal;

    return mat4(
        vec4(rayStart + vec3(o * ray_thickness,0.0),1.0),
        vec4(rayStart - vec3(o * ray_thickness,0.0),1.0),
        vec4(rayEnd + vec3(o * ray_thickness,0.0),1.0),
        vec4(rayEnd - vec3(o * ray_thickness,0.0),1.0)
    );
}

int positionToIndex(vec2 position) {
    // map (-1,-1) to 0, (-1,1) to 1, (1,-1) to 2, (1,1) to 3
    int x = position.x == -1.0 ? 0 : 1;
    int y = position.y == -1.0 ? 0 : 1;
    return x + y * 2;
}

mat4 debugPositions() {
    return mat4(
        vec4(-.5,-.5,-1.,1.0),
        vec4(-.5,.5,-1.,1.0),
        vec4(.2,-.2,-1.,1.0),
        vec4(.2,.2,-1.,1.0)
    );
}

struct ParticleParams {
    float progress;
    uint incarnation;
    float angle;
    float ray_length_variation_factor;
    float ray_thickness_variation_factor;
    float texture_sample_factor;
    vec3 chaos_vector;
};

ParticleParams ppar_for(uint instance_key, float frame, float lifecycle) {
    float offset = u01(stream(uvec3(instance_key, 0u, 0u)));
    float startFrame = -((offset * lifecycle));
    float elapsedFrames = frame - startFrame;
    uint incarnation = uint(floor(elapsedFrames / lifecycle));
    float progress = fract(elapsedFrames / lifecycle);
    float angle = mix(0.,360.,u01(stream(uvec3(instance_key, incarnation, 1u))));
    float ray_length_variation = u01(stream(uvec3(instance_key, incarnation, 2u)));
    float ray_thickness_variation = u01(stream(uvec3(instance_key, incarnation, 3u)));
    float texture_sample_factor = u01(stream(uvec3(instance_key, incarnation, 4u)));
    vec3 chaos_vector = vec3(u01(stream(uvec3(instance_key, incarnation, 5u))), u01(stream(uvec3(instance_key, incarnation, 6u))), u01(stream(uvec3(instance_key, incarnation, 7u))));
    chaos_vector -= vec3(0.5);
    return ParticleParams(progress, incarnation, angle, ray_length_variation, ray_thickness_variation, texture_sample_factor, chaos_vector);
}



out vec2 uv;
out float texture_sample_factor;
out float progress_factor;
void main() {

    uint instance_key = uint(gl_InstanceID);
    ParticleParams ppar = ppar_for(instance_key,  time,  lifecycle);

    float nearCircleDistance = tunnelData.x;
    float nearCircleRadius = tunnelData.y;
    float farCircleDistance = tunnelData.z;
    float farCircleRadius = tunnelData.w;
    mat4 t = translation(vec3(0.0, 0.5, 0.0));
    mat4 r = rotation(vec3(.0, 1.0, 0.0), 15.0);
    mat4 p = perspective_projection(16.0/9.0, 45.0, -nearCircleDistance, -farCircleDistance);
    //gl_Position = p * r * vec4(position, -5.0, 1.0);


    float ray_length = rayData.x;
    float ray_thickness = rayData.y;


    float final_ray_length = clamp(ray_length * (1.0 + ppar.ray_length_variation_factor * ray_length_variation - ray_length_variation / 2.),0.,1.);
    float final_ray_thickness = clamp(ray_thickness * (1.0 + ppar.ray_thickness_variation_factor * ray_thickness_variation - ray_thickness_variation / 2.),0.,1.);
    mat4 rayPositions = generateRayPositions(nearCircleDistance, nearCircleRadius, farCircleDistance, farCircleRadius, ppar.angle, final_ray_length, ppar.progress, final_ray_thickness,normalize(ppar.chaos_vector));

    //mat4 rayPositions = debugPositions();
    int idx = positionToIndex(position);
    gl_Position = p * rayPositions[idx];
    uv = (position / vec2(2.0, 2.0)) + vec2(0.5);
    texture_sample_factor = ppar.texture_sample_factor;
    progress_factor = ppar.progress;
}