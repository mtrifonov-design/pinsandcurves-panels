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
                float Val = smoothstep(-0.02, 0., d) * smoothstep(0.02, 0., d);
                float sdfVal = prev.r + 100.;
                Val = d > -0.02 && d < 0.02 ? 1.0 : 0.0;
                Val = sin(sdfVal * 3.14159 * 20.0) * 0.5 + 0.5;
                float dist_d = dist / 100.;
                float width_d = width / 100.;
                width_d = width_d < 0.01 ? 0.01 : width_d;
                float alph = smoothstep(0. + dist_d - width_d / 2.,0.01 + dist_d - width_d / 2.0, sdfVal) * smoothstep(width_d / 2. + dist_d, width_d / 2. - 0.01 + dist_d, sdfVal);
                // map value to dist - dist+width to 0 1
                float rel = (sdfVal - dist_d + width_d / 2.) / width_d;
                //rel = pow((rel - 0.5) * 2., 2.0);
                vec3 color1 = vec3(0.0, 1.0, 0.4);
                vec3 color2 = vec3(0.5, 0.0, 1.0);
                //vec3 mixed = mix(color2, color1, sin(rel * 3.14 * 5.));
                vec3 mixed = vec3(sin(rel * 3.14 * 2.) * 0.5 + 0.5, sin(rel * 3.14 * 3.) * 0.5 + 0.5, sin(rel * 3.14 * 4.) * 0.5 + 0.5);
                vec4 srcPx = texture(srcIm, uv);
                // use premultiplied alpha to mix srcPx and mixed
                vec3 finalCol = mix(srcPx.rgb * srcPx.a, mixed, alph);
                float finalAlph = max(srcPx.a, alph);
                outColor = vec4(finalCol, finalAlph);
                
}
                `,
                textures: {
                    src: {
                        filter: "nearest",
                        wrap: "clamp",
                    },
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
                            src: inputSDFTexture,
                            srcIm: inputTexture,
                        }
                    },
                ],
            }),
        }
    })
}

export default Main;