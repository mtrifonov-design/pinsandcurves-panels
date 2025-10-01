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
                float sdRoundedX( in vec2 p, in float w, in float r )
                {
                    p = abs(p);
                    return length(p-min(p.x+p.y,w)*0.5) - r;
                }
                void main() {
                vec4 prev = texture(src, uv);
                float d   = prev.r * 2.0 - 1.0;
                vec2  gF  = prev.gb * 2.0 - 1.0;
                float Val = smoothstep(-0.02, 0., d) * smoothstep(0.02, 0., d);
                float sdfVal = prev.r + 100.;
                Val = d > -0.02 && d < 0.02 ? 1.0 : 0.0;
                Val = sin(sdfVal * 3.14159 * 20.0) * 0.5 + 0.5;
                float dist_d = dist / 100.;
                float alph = 1. * smoothstep(dist_d, dist_d - 0.01, sdfVal);
                float rel = clamp(sdfVal,0.,dist_d) / dist_d;
                

                // compute distance to nearest grid point ( spaced 0.1)
                float gridSize = 0.05;
                float freqd =freq / 10.;
                freqd = freqd < 1e-4 ? 1e-4 : freqd;
                vec2 gridUV = uv / gridSize + vec2(freqd, 0.);
                vec2 gridPoint = floor(gridUV) + 0.5;
                vec2 diff = gridUV - gridPoint;
                float gridDist = sdRoundedX(diff, 0.01, 0.01);

                // map distance to 0-1 range with smoothstep
                float gridVal = smoothstep(0.45, 0.5, gridDist);
                // mix color based on gridVal
                vec3 color1 = vec3(0.05, 0.1, 0.3);
                vec3 color2 = vec3(1.0, 0.2, 0.4);

                vec3 mixed = mix(color2, color1, gridVal);
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