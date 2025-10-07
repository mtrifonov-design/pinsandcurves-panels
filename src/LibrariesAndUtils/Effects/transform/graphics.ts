import { build, external, Global, GlobalSignature, Program, Texture } from "../../NectarGL/Builder";
import putTexture from "../../StandardGraphics/putTexture";

function Main({
    quad,
    quadSig,
    canvasSig,
    compositionGlobal,
    compositionGlobalSig,
    inputTexture,
    inputSDFTexture,
    exportName,
    signals,
    signalsSig
}: {
    quad: string,
    quadSig: string,
    canvasSig: string,
    compositionGlobal: string,
    compositionGlobalSig: string,
    inputTexture: string,
    inputSDFTexture: string,
    exportName: string,
    signals: string,
    signalsSig: string,
}) {
    return build(ref => {
        return {
            p_circle : Program({
                vertexSignature: quadSig,
                globalSignatures: {
                    c: compositionGlobalSig,
                    s: signalsSig,
                },
                vertexShader: `
                out vec2 uv;
                void main() {
                    float tx = x / 100. * 2.0 - 1.0;
                    float ty = y / 100. * 2.0 - 1.0;
                    float aspect = canvas.x / canvas.y;
                    vec2 prePos = position.xy * vec2(aspect, 1.0);
                    float angle = r / 100. * 3.14159 * 2.0;
                    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
                    mat2 scale = mat2(scale_x / 50., 0.0, 0.0, scale_y / 50.);
                    vec2 pos = rot * scale * prePos + vec2(tx, ty);
                    pos /= vec2(aspect, 1.0);
                    // correct uv for aspect ratio
                    uv = position / 2. + vec2(0.5);
                    gl_Position = vec4(pos.xy, 0.0, 1.0);
                }
                `,
                fragmentShader: `
                in vec2 uv;
                void main() {
                outColor = texture(srcIm, uv);
                }
                `,
                textures: {
                    srcIm: {
                        filter: "linear",
                        wrap: "clamp",
                    }
                },
            }),
            out: Texture({
                signature: canvasSig,
                drawOps: [
                    {
                        program: ref("p_circle"),
                        vertex: quad,
                        globals: {
                            c: compositionGlobal,
                            s: signals,
                        },
                        textures: {
                            srcIm: inputTexture,
                        }
                    },
                ],
            }),
        }
    })
}

export default Main;