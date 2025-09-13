#include "./projection_rotation_translation.glsl";
#include "./minRadius.glsl";

out vec2 uv;
void main() {
    vec3 o_point = origin.xyz;
    o_point.z = mix(-10.,-28.,origin.z);
    o_point.xy = origin.xy * 2. - vec2(1.);
    o_point.xy *= minRadius(o_point.z, 45.0, canvas.x/canvas.y);
    mat4 t = translation(o_point);
    mat4 p = perspective_projection(canvas.x/canvas.y, 45.0, .01, -o_point.z + 0.1);
    gl_Position = p * t * vec4(position.xy, 0.0, 1.0);
    uv = position.xy * 0.5 + 0.5;
    mat4 adjustScaleAndFlipY = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, -2.25, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
    mat4 s = adjustScaleAndFlipY;
    mat4 position_relative = translation(vec3(0., .6, 0.));
    mat4 t_ = position_relative;
    vec3 tiltXAxis = vec3(0.,1.,0.);
    vec3 tiltYAxis = vec3(1.,0.,0.);
    mat4 tiltXMat = rotation(tiltXAxis,tiltX * 180.);
    mat4 tiltYMat = rotation(tiltYAxis,tiltY * 180.);
    gl_Position = p * t * s * tiltXMat * tiltYMat * t_ * vec4(position.xy, 0.0, 1.0);
}