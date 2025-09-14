vec2 texSize(sampler2D src) {
    return vec2(textureSize(src, 0));
}
float widthF(sampler2D src) { return texSize(src).x; }
vec2 uvForIndex(int i, sampler2D src) {
    float u = (float(i) + 0.5) / widthF(src);
    return vec2(u, 0.5);
}
vec4 readSlot(int i, sampler2D src) { return texture(src, uvForIndex(i, src)); }

