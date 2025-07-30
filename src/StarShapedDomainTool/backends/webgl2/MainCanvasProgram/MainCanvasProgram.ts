import Program from "../HelperLib/Program";
import { UniformProviderSignature } from "../HelperLib/UniformProvider";
import { VertexProviderSignature } from "../HelperLib/VertexProvider";
const mainCanvasProgram = (
    gl : WebGL2RenderingContext,
    uSig : UniformProviderSignature,
    vSig : VertexProviderSignature
) => new Program(gl, {
            vertexShader: `
            out vec2 v_texCoord;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_position;
            }
        `,
            fragmentShader: `
            out vec4 outColor;
            in vec2 v_texCoord;
            uniform sampler2D u_texture;
            uniform sampler2D u_colorGradient;
            #define N 32
            #define SIGMA 0.005

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
                d_mod = d_mod * endPos;
                for (int i = 0; i < numberColorStops; i++) {
                    vec2 pc = vec2(float(i) / float(numberColorStops),float(i+1) / float(numberColorStops));
                    vec2 pos = pc * endPos;
                    vec4 col1 = texture(u_colorGradient, vec2(pos.x, 0.5));
                    vec4 col2 = texture(u_colorGradient, vec2(pos.y, 0.5));

                    if (d_mod >= col1.a * endPos && d_mod < col2.a * endPos) {
                        colorA = col1.rgb;
                        colAPos = col1.a * endPos;
                        colorB = col2.rgb;
                        colBPos = col2.a * endPos;
                        break;
                    }
                }

                float relD = (d_mod - colAPos) / (colBPos - colAPos);
                //colorA = vec3(1.,0.,0.);
                //colorB = vec3(0.,0.,1.);
                return vec4(mix(colorA, colorB, relD), 1.0);

                // float debugVal = 0.0;
                // for (int i = 0; i < numberColorStops; i++) {
                //     debugVal += 0.1;
                // }   

                //return vec4(vec3(debugVal), 0.);
                //return vec4(1.);


                //return vec4(mix(colorA, colorB, smoothstep(0.0, 1.0, d_mod)), 1.0);
                //return texture(u_colorGradient, vec2(0.018, 0.5));
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
                    float span = 0.03;
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
        `,
            vertexProviderSignature: vSig,
            uniformProviderSignature: uSig
        });

export { mainCanvasProgram };