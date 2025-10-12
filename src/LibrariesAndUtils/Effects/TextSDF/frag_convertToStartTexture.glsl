
in vec2 uv;
void main() {
    float texPx = texture(src, uv).r;
    vec2 objPos = vec2(1./0.);
    if (texPx > 0.5) {
        objPos = uv;
    }
    outColor = vec4(objPos, 0., 1.);
}