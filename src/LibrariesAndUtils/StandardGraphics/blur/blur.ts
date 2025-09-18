import { build, external, Global, GlobalSignature, Program, Texture } from "../../NectarGL/Builder";
import putTexture from "../putTexture";
import blurX from './blurX_fs.glsl';
import blurY from './blurY_fs.glsl';

function Blur({
    quad,
    quadSig,
    canvasSig,
    compositionGlobal,
    compositionGlobalSig,
    inputTexture,
    blurExportName,
}: {
    quad: string,
    quadSig: string,
    canvasSig: string,
    compositionGlobal: string,
    compositionGlobalSig: string,
    inputTexture: string,
    blurExportName: string
}) {
    return build(ref => {
        return {
            global_sig: GlobalSignature({
                amount: 'float',
            }),
            global: Global({
                signature: ref("global_sig"),
                exportName: blurExportName
            }),
            p_blurX : Program({
                vertexSignature: quadSig,
                globalSignatures: {
                    g: ref("global_sig"),
                    c: compositionGlobalSig,
                },
                vertexShader: `
                out vec2 uv;
                void main() {
                    uv = position / 2. + vec2(0.5);
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
                `,
                fragmentShader: blurX,
                textures: {
                    src: {
                        filter: "linear",
                        wrap: "clamp",
                    }
                },
            }),
            p_blurY : Program({
                vertexSignature: quadSig,
                globalSignatures: {
                    g: ref("global_sig"),
                    c: compositionGlobalSig,
                },
                vertexShader: `
                out vec2 uv;
                void main() {
                    uv = position / 2. + vec2(0.5);
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
                `,
                fragmentShader: blurY,
                textures: {
                    src: {
                        filter: "linear",
                        wrap: "clamp",
                    }
                },
            }),
            // p_drawTex : Program({
            //     vertexSignature: quadSig,
            //     globalSignatures: {
            //     },
            //     vertexShader: `
            //     out vec2 uv;
            //     void main() {
            //         uv = position / 2. + vec2(0.5);
            //         gl_Position = vec4(position.xy, 0.0, 1.0);
            //     }
            //     `,
            //     fragmentShader: `
            //     in vec2 uv;
            //     void main() {
            //         outColor = texture(src, uv);
            //     }
            //     `,
            //     textures: {
            //         src: {
            //             filter: "linear",
            //             wrap: "clamp",
            //         }
            //     },
            // }),
            p_drawTex : putTexture(quadSig),
            pass1: Texture({
                signature: canvasSig,
                drawOps: [
                    {
                        program: ref("p_blurX"),
                        vertex: quad,
                        globals: {
                            g: ref("global"),
                            c: compositionGlobal
                        },
                        textures: {
                            src: inputTexture
                        }
                    }
                ],
            }),
            out: Texture({
                signature: canvasSig,
                drawOps: [
                    {
                        program: ref("p_blurY"),
                        vertex: quad,
                        globals: {
                            g: ref("global"),
                            c: compositionGlobal
                        },
                        textures: {
                            src: ref("pass1")
                        }
                    },
                ],
            }),
        }
    })
}

export default Blur;