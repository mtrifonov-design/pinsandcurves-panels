import Program from "../HelperLib/Program";
import { UniformProviderSignature } from "../HelperLib/UniformProvider";
import { VertexProviderSignature } from "../HelperLib/VertexProvider";
import frag from './frag.glsl';


const effectProgram = (
    gl : WebGL2RenderingContext,
    uSig : UniformProviderSignature,
    vSig : VertexProviderSignature
) => new Program(gl, {
            vertexShader: `
            out vec2 v_texCoord;
            void main() {
                mat3 m = mat3(
                    boundingBox.x, 0., 0.,
                    0., boundingBox.y, 0.,
                    boundingBox.z, boundingBox.w, 1.
                );
                vec3 pos = m * vec3(a_position, 1.0);

                gl_Position = vec4(pos.xy, 0.0, 1.0);
                v_texCoord = texCoord;
            }
        `,
            fragmentShader: frag,
            vertexProviderSignature: vSig,
            uniformProviderSignature: uSig
        });

export { effectProgram };