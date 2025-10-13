in vec2 uv;
void main() {
    vec2 texPx = texture(src, uv).rg;
    vec2 invTexPx = texture(srcInv, uv).rg;
    float l1 = length(texPx - uv);
    float l2 = length(invTexPx - uv);
    float dist = (l1-l2) - 100.;
    vec2 normal = normalize((texPx - uv) - (invTexPx - uv));
    outColor = vec4(dist, normal, 1.);
}