import { build,
    VertexSignature,
    InstanceSignature,
    GlobalSignature,
    TextureSignature,
    Program,
    Vertex,
    Instance,
    Global,
    Texture,
    Use,
    exportResources,
    external
 } from "../../../LibrariesAndUtils/NectarGL/Builder"
import { DrawOp } from "../../../LibrariesAndUtils/NectarGL/Builder/ResourceBuilders";
function Main() {
    return build((ref: any) => {
        const p_drawCircle = Program({
            vertexSignature: external("quadSig"),
            textures: {},
            globalSignatures: {},
            vertexShader: `
                out vec2 uv;
                void main() {
                    uv = position.xy * 0.5 + 0.5;
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
            `,
            fragmentShader: `
                in vec2 uv;
                void main() {
                    vec2 centeredUV = uv - 0.5;
                    float dist = length(centeredUV);
                    if (dist < 0.5) {
                        outColor = vec4(1.0, 0.0, 0.0, 1.0);
                    } else {
                        discard;
                    }
                }
            `,
        });
        const d_drawCircle = DrawOp({
            vertex: external("quad"),
            globals: {},
            textures: {},
            program: ref("p_drawCircle"),
        });
        const out = Texture({
            signature: external("canvasSig"),
            drawOps: [d_drawCircle],
        });
        return ({
            p_drawCircle,
            out
        });
    });
}
export default Main;