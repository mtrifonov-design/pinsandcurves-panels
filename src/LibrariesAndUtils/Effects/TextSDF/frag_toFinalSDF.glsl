in vec2 uv;
void main() {
    vec2 texPx = texture(src, uv).rg;
    float dist = length(texPx - uv) - 100.;
    outColor = vec4(vec2(dist), 0., 1.);
}