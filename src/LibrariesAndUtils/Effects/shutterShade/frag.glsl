in vec2 uv;
#define PI 3.141592653589793
void main() {


    // calculate the nearest shutter line
    float shutterX = floor(uv.x * ceil(numAxes)) / ceil(numAxes) + (0.5 / ceil(numAxes));
    vec2 uvCentered = uv - vec2(shutterX, uv.y);
    uvCentered *= 1.2;
    vec2 uvFinal = uvCentered + vec2(shutterX, uv.y);
    vec4 srcPx = texture(srcIm,uvFinal);
    outColor = srcPx;
}
