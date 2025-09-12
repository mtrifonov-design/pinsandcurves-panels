mat4 perspective_projection(float aspect, float fov, float near, float far) {
    //float fov = 45.0;
    //float aspect = 1920.0 / 1080.0;
    //float near = 0.1;
    //float far = 100.0;
    float top = near * tan(radians(fov) / 2.0);
    float right = top * aspect;
    return mat4(
        vec4(near / right, 0.0, 0.0, 0.0),
        vec4(0.0, near / top, 0.0, 0.0),
        vec4(0.0, 0.0, -(far + near) / (far - near), -1.0),
        vec4(0.0, 0.0, -(2.0 * far * near) / (far - near), 0.0)
    );
}

mat4 translation(vec3 vector) {
    return mat4(
        vec4(1.0, 0.0, 0.0, 0.0),
        vec4(0.0, 1.0, 0.0, 0.0),
        vec4(0.0, 0.0, 1.0, 0.0),
        vec4(vector, 1.0)
    );
}

mat4 rotation(vec3 axis, float angle) {

    axis = normalize(axis);
    mat3 w = mat3(
        vec3(0.0, axis.z, -axis.y),
        vec3(-axis.z, 0.0, axis.x),
        vec3(axis.y, -axis.x, 0.0)
    );

    mat3 I = mat3(
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(0.0, 0.0, 1.0)
    );

    mat3 intermediate = mat3(
        I + sin(radians(angle)) * w + (1.0 - cos(radians(angle))) * w * w
    );

    return mat4(
        vec4(intermediate[0], 0.0),
        vec4(intermediate[1], 0.0),
        vec4(intermediate[2], 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
}