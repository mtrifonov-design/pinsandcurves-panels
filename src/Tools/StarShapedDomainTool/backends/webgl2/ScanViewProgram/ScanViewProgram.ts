import Program from "../HelperLib/Program";
import { UniformProviderSignature } from "../HelperLib/UniformProvider";
import { VertexProviderSignature } from "../HelperLib/VertexProvider";
const scanViewProgram = (
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
            #define N 32
            #define SIGMA 0.005

            float gaussian(float x, float sigma) {
                return exp(-0.5 * (x * x) / (sigma * sigma));
            }

            void main() {
                vec2 distVector = v_texCoord - shapePoint;
                float normedDistance = sqrt(dot(distVector, distVector));
                float angle = (atan(-distVector.y, -distVector.x) + 3.14159265) / 6.28318530718;

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
                targetDistance *= sqrt(8.);
                
                float currentDistance = normedDistance;
                if (currentDistance < targetDistance) {
                    vec4 inner = vec4(0.0,0.0,1.0,1.0);
                    vec4 outer = vec4(0.0,0.0,1.0,.5);
                    outColor = mix(inner, outer, currentDistance / targetDistance);
                    float edge = 0.05;
                    float edgeFactor = smoothstep(targetDistance - edge, targetDistance + edge, currentDistance);
                    outColor = mix(outColor, vec4(0.0, 0.0, 1.0, 1.0), edgeFactor);
                } else {
                    outColor = vec4(0.0, 0.0, 0.0, 0.0);
                }
            }
        `,
            vertexProviderSignature: vSig,
            uniformProviderSignature: uSig
        });

export { scanViewProgram };