in vec2 uv;

#include "../../../LibrariesAndUtils/lygia/filter/gaussianBlur/1D.glsl"

void main() {
    vec2 off = vec2(4.0 / canvas.x, 0.0);
    int kernelSize = int( mix(1., 15., amount) );
    outColor = gaussianBlur1D(src, uv, off, kernelSize);
}