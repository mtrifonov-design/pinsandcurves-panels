import { build, external, Global, GlobalSignature, Program, Texture } from "../../NectarGL/Builder";
import putTexture from "../../StandardGraphics/putTexture";


function Main({
    quad,
    quadSig,
    canvasSig,
    compositionGlobal,
    compositionGlobalSig,
    inputTexture,
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

                    // correct uv for aspect ratio
                    uv = position / 2. + vec2(0.5);
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
                `,
                fragmentShader: `
                in vec2 uv;

                void main() {
                vec4 prev = texture(src, uv);
                float d   = prev.r * 2.0 - 1.0;
                vec2  gF  = prev.gb * 2.0 - 1.0;
                float Val = smoothstep(-0.1, 0., d);
                Val = smoothstep(0., 0.1, Val);
    
    outColor = vec4(Val,Val,Val, 1.0);
}


                `,
                textures: {
                    src: {
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
                            src: inputTexture
                        }
                    },
                ],
            }),
        }
    })
}

export default Main;