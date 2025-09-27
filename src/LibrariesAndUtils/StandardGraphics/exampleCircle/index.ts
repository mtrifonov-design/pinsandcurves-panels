import { build, external, Global, GlobalSignature, Program, Texture } from "../../NectarGL/Builder";
import putTexture from "../putTexture";
import blurX from './blurX_fs.glsl';
import blurY from './blurY_fs.glsl';

function ExampleCircle({
    quad,
    quadSig,
    canvasSig,
    compositionGlobal,
    compositionGlobalSig,
    inputTexture,
    exportName,
}: {
    quad: string,
    quadSig: string,
    canvasSig: string,
    compositionGlobal: string,
    compositionGlobalSig: string,
    inputTexture: string,
    exportName: string
}) {
    return build(ref => {
        return {
            p_circle : Program({
                vertexSignature: quadSig,
                globalSignatures: {
                    c: compositionGlobalSig,
                },
                vertexShader: `
                out vec2 uv;
                void main() {
                    uv = position / 2. + vec2(0.5);
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
                `,
                fragmentShader: `
                in vec2 uv;
                void main() {
                    float r = length(uv - vec2(0.5));
                    float radius = exampleSignal / 100.;
                    float alpha = smoothstep(radius, radius - 0.02, r);
                    outColor = vec4(1.0, 1.0, 1.0, alpha);
                }
                `,
                textures: {
                    // src: {
                    //     filter: "linear",
                    //     wrap: "clamp",
                    // }
                },
            }),
            out: Texture({
                signature: canvasSig,
                drawOps: [
                    {
                        program: ref("p_circle"),
                        vertex: quad,
                        globals: {
                            c: compositionGlobal
                        },
                        textures: {
                            //src: inputTexture
                        }
                    },
                ],
            }),
        }
    })
}

export default ExampleCircle;