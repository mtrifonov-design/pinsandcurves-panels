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

                vec3 sdgHeart( in vec2 p )
                {
                    float sx = (p.x<0.0)?-1.0:1.0;
                    p.x = abs(p.x);
                
                    if( p.y+p.x>1.0 )
                    {
                        const float r = sqrt(2.0)/4.0;
                        vec2 q0 = p - vec2(0.25,0.75);
                        float l = length(q0);
                        vec3 d = vec3(l-r, q0/l);
                        d.y *= sx;
                        return d;
                    }
                    else
                    {
                        vec2 q1 = p - vec2(0.0,1.0);      vec3 d1 = vec3(dot(q1,q1),q1);
                        vec2 q2 = p - 0.5*max(p.x+p.y,0.0); vec3 d2 = vec3(dot(q2,q2),q2);
                        vec3 d = (d1.x<d2.x) ? d1: d2;
                        d.x = sqrt(d.x);
                        d.yz /= d.x;
                        d *= (p.x>p.y)?1.0:-1.0;
                        d.y *= sx;
                        return d;
                    }
                }
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
                    float d_prev = prevPx.r;
                    vec2 C = vec2((posX / 100.0), (posY / 100.0));
                    float R = radius / 100.0;
                    // adjust C so that the circle can leave the screen (extend by radius in all directions)
                    C = vec2(C.x * (1. + aspect), C.y * (1.));
                    vec2 P  = vec2(uv.x * aspect, uv.y);
                    vec2 Pc = vec2(C.x * aspect,  C.y);

                    vec2 v = P - Pc;
                    R = R < 1e-5 ? 1e-5 : R;
                    vec3 newHeart = sdgHeart(v / R); 
                    newHeart.x -= 100.;
                    vec3 o = smin(newHeart, prevPx.rgb, 0.1);
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