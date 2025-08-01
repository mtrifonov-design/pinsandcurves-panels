out vec4 outColor;
in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform sampler2D u_colorGradient;
#define N 32
#define SIGMA 0.005

#include "/src/lygia/color/space/oklab2rgb.glsl"
#include "/src/lygia/color/space/rgb2oklab.glsl"

float gaussian(float x, float sigma) {
    return exp(-0.5 * (x * x) / (sigma * sigma));
}

vec4 getColorFromGradient(float d) {
    //d -= time.x;
    d += time.x * canvasBox.z;
    float d_mod = mod(d, canvasBox.z);
    d_mod /= canvasBox.z;

    vec3 colorA = vec3(0.);
    vec3 colorB = vec3(0.);
    float colAPos = 0.0;
    float colBPos = 0.0;
    float maxColors = 200.;
    float endPos = float(numberColorStops) / maxColors;
    d_mod = d_mod;
    for (int i = 0; i < numberColorStops; i++) {
        vec2 pc = vec2(float(i) / float(numberColorStops),float(i+1) / float(numberColorStops));
        vec2 pos = pc * endPos;
        vec2 pixPos = vec2((float(i) + 0.5) / maxColors, (float(i+1) + 0.5) / maxColors);
        vec4 col1 = texture(u_colorGradient, vec2(pixPos.x, 0.5));
        vec4 col2 = texture(u_colorGradient, vec2(pixPos.y, 0.5));

        if (d_mod >= col1.a && d_mod < col2.a) {
            colorA = col1.rgb;
            colAPos = col1.a;
            colorB = col2.rgb;
            colBPos = col2.a;
            break;
        }
    }

    float relD = (d_mod - colAPos) / (colBPos - colAPos);
    //colorA = vec3(1.,0.,0.);
    //colorB = vec3(0.,0.,1.);
    //return vec4(mix(colorA, colorB, relD), 1.0);
    return vec4(oklab2rgb(mix(rgb2oklab(colorA), rgb2oklab(colorB), relD)), 1.0);

}

float perspectiveFunction(float d) {
    float slope = perspectiveFactor * 10.;
    float y = 1. + slope * d;
    return 1. / (d + (1. - perspectiveFactor));


    //return mix(d, pow(d, 0.33), perspectiveFactor);
}

void main() {

    vec2 distVector = v_texCoord - canvasBox.xy;

    float normedDistance = sqrt(dot(distVector, distVector));
    float angle = (atan(distVector.y, distVector.x) + 3.14159265) / 6.28318530718;

    float accum = 0.0;
    float totalWeight = 0.0;
    for (int i = 0; i < N; i++) {
        float offset = (float(i) - float(N) * 0.5 + 0.5) / float(N); 
        float span = 0.02;
        offset *= span; 
        float weight = gaussian(offset, SIGMA);
        float pos = mod(angle + offset, 1.0); 
        float sample_ = texture(u_texture, vec2(pos, 0.5)).r;

        accum += sample_ * weight;
        totalWeight += weight;
    }
    float blurred = accum / totalWeight;
    
    float targetDistance = texture(u_texture, vec2(angle, 0.5)).r;
    targetDistance = blurred;
    
    float currentDistance = normedDistance;
    vec2 maxDistancePoint = vec2(sqrt(2.)) - canvasBox.xy;
    float maxDistance = sqrt(dot(maxDistancePoint, maxDistancePoint));
    float distance = currentDistance;

    distance /= targetDistance;


    // distance = max(distance, -(1.-canvasBox.w));
    // distance += (1.-canvasBox.w);
    float PI = 3.14159265;
    distance = perspectiveFunction(distance);
    //distance *= 10.;

    vec4 color = getColorFromGradient(distance);
    
    outColor = color;



    //outColor = vec4(vec3(distance), 1.0);
}