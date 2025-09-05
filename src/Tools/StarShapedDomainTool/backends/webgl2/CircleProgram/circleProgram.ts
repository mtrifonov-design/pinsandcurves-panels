import Program from "../HelperLib/Program";
import { UniformProviderSignature } from "../HelperLib/UniformProvider";
import VertexProvider from "../HelperLib/VertexProvider";

const circleVertexSignature = {
    vertexProviderName: 'CircleVertexProvider',
    vertexStructure: [
        { name: 'a_position', type: 'vec2' },
        { name: 'size', type: 'float' },
        { name: 'a_color', type: 'vec4' },
    ],
    vertexCount: 4,
    indexCount: 6,
    instancedCall: false
};

const circleVertexProvider = (gl: WebGL2RenderingContext) => {
    const prov = new VertexProvider(gl, circleVertexSignature);
    prov.setup();
    prov.setVertexData({
        a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0],
        size: [1.0, 1.0, 1.0, 1.0],
        a_color: [1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0]
    });
    prov.setIndexData([0, 1, 2, 1, 2, 3]);
    return prov;
};

const circleProgram = (gl: WebGL2RenderingContext, uniformProviderSignature: UniformProviderSignature) => new Program(gl, {
            vertexShader: `
            out vec2 v_texCoord;
            out vec4 v_color;
            void main() {
                mat3 m = mat3(
                    boundingBox.x, 0., 0.,
                    0., boundingBox.y, 0.,
                    boundingBox.z, boundingBox.w, 1.
                );
                vec3 pos = m * vec3(a_position, 1.0);
                v_color = a_color;

                gl_Position = vec4(pos.xy, 0.0, 1.0);
                v_texCoord = a_position;
            }
            `,
            fragmentShader: `
            out vec4 outColor;
            in vec4 v_color;
            in vec2 v_texCoord;
            void main() {
                vec2 center = shapePoint;
                float radius = length(center - v_texCoord);
                float size = .05; 
                if (radius < size) {
                    outColor = vec4(1.,1.0,1.0,1.);
                } else {
                    outColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent outside the circle
                }
                //outColor = vec4(1.,0.,0.,1.);
            }
            `,
            vertexProviderSignature: circleVertexSignature,
            uniformProviderSignature: uniformProviderSignature
        });

export { circleProgram, circleVertexProvider };