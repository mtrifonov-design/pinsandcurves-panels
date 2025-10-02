import { build, external, Global, GlobalSignature, Program, Texture } from "../../NectarGL/Builder";
import putTexture from "../../StandardGraphics/putTexture";


function Main({
    quad,
    quadSig,
    canvasSig,
    sdfSig,
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
    sdfSig: string,
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
                    uv = position / 2. + vec2(0.5);
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
                `,
                fragmentShader: `
                in vec2 uv;

                // float smin( float a, float b, float k)
                // {
                //     k *= 4.0;
                //     float h = max( k-abs(a-b), 0.0 )/k;
                //     return min(a,b) - h*h*k*(1.0/4.0);
                // }
                vec3 smin( in vec3 a, in vec3 b, in float k )
                {
                    k *= 4.0;
                    float h = max(k-abs(a.x-b.x),0.0)/(2.0*k);
                    return vec3(min(a.x,b.x)-h*h*k,
                                mix(a.yz,b.yz,(a.x<b.x)?h:1.0-h));
                }

                void main() {
                    float aspect = canvas.x / canvas.y;
                    vec4 prevPx = texture(src, uv);
                    vec2 g = prevPx.gb;
                    vec2 C = vec2(0.);
                    // get angle
                    float a = atan(g.y, g.x);
                    float PI = 3.14159;
                    a = a < 0.0 ? a + 2.0*PI : a;
                    float distort = sin(a  * floor(freq)) * (intensity / 100.0) * 0.1;
                    vec3 o = vec3(prevPx.r + distort, prevPx.g, prevPx.b);
                    outColor = vec4(o, 1.0);
                }
                `,
                textures: {
                    src: {
                        filter: "nearest",
                        wrap: "clamp",
                    }
                },
            }),
            sdfOut: Texture({
                signature: sdfSig,
                drawOps: [
                    {
                        program: ref("p_circle"),
                        vertex: quad,
                        globals: {
                            c: compositionGlobal,
                            s: signals,
                        },
                        textures: {
                            src: inputSDFTexture
                        }
                    },
                ],
            }),
        }
    })
}

export default Main;