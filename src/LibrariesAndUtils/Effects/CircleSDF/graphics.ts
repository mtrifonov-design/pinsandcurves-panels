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

                float smin( float a, float b, float k)
                    {
                        k *= 4.0;
                        float h = max( k-abs(a-b), 0.0 )/k;
                        return min(a,b) - h*h*k*(1.0/4.0);
                    }

                void main() {
                    float aspect = canvas.x / canvas.y;

                    // Incoming field
                    vec4 prevPx = texture(src, uv);
                    float d_prev = prevPx.r;
                    vec2  g_prev = (prevPx.gb - vec2(0.5)) * 2.; // (grad.x, grad.y) remap to [-1,1]

                    // Circle SDF & gradient (in same metric as prev)
                    vec2 C = vec2((posX / 100.0) + 0.5, (posY / 100.0));
                    float R = radius / 100.0;

                    vec2 P  = vec2(uv.x * aspect, uv.y);
                    vec2 Pc = vec2(C.x * aspect,  C.y);

                    vec2 v = P - Pc;
                    float lenv = length(v);
                    float d_new = clamp(lenv - R, -1.,1.);

                    vec2  g_new = (lenv > 1e-8) ? (v / lenv) : vec2(0.0); // outward unit normal

                    float d_out;
                    vec2  g_out;

                    // --- Smooth union (polynomial, Inigo Quilez style) ---
                    // k is a softness scale in *distance* units. Larger => softer blending.
                    float k = 1.;

                    // Blend factor
                    float h = clamp(0.5 + 0.5 * (d_new - d_prev) / k, 0.0, 1.0);

                    // Distance
                    //d_out = mix(d_new, d_prev, h) - k * h * (1.0 - h);
                    d_prev = d_prev * 2. - 1.;
                    d_out = smin(d_new, d_prev, 0.05 * R);
                    d_out = (d_out + 1.) / 2.;


                    // Gradient: practical blend of normals (ignoring ∇h term; good for gfx)
                    g_out = normalize(mix(g_new, g_prev, h)) / 2. + 0.5; // remap to [0,1]


                    outColor = vec4(d_out, g_out.x, g_out.y, 1.0);
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