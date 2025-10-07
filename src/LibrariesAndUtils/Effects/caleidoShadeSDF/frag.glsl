in vec2 uv;
#define PI 3.141592653589793
void main() {

    
    vec2 uvCentered = uv - vec2(posX / 100., posY / 100.);
    uvCentered.x *= (canvas.x / canvas.y); // correct aspect
    // to radial coords
    float r = length(uvCentered);
    float theta = atan(uvCentered.y, uvCentered.x);
    // kaleido effect
    float anglePerSegment = 2. * PI / ceil(numAxes);
    theta = mod(theta, anglePerSegment);
    // back to cartesian
    uvCentered = r * vec2(cos(theta), sin(theta));
    //uvCentered.x /= (canvas.x / canvas.y); // correct aspect back
    vec2 uvFinal = uvCentered + vec2(posX / 100., posY / 100.);
    vec4 srcPx = texture(srcIm,uvFinal);
    outColor = srcPx;
}
