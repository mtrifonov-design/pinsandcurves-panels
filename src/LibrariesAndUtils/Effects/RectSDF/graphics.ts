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
            p_visField : Program({
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

                vec3 smin( in vec3 a, in vec3 b, in float k )
                {
                    k *= 4.0;
                    float h = max(k-abs(a.x-b.x),0.0)/(2.0*k);
                    return vec3(min(a.x,b.x)-h*h*k,
                                mix(a.yz,b.yz,(a.x<b.x)?h:1.0-h));
                }

                float sdSegment( in vec2 p, in vec2 a, in vec2 b )
                {
                    vec2 pa = p-a, ba = b-a;
                    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
                    return length( pa - ba*h );
                }

                void main() {
                    
                    float gridSize = 0.03;
                    vec2 gridUv = uv / gridSize;
                    vec2 gv = fract(gridUv);
                    gv = gv * 2.0 - 1.0;
                    vec2 id = floor(gridUv);
                    vec4 gridCenterPx = texture(field, (id + 0.5) * gridSize);
                    float mag = smoothstep(-5.,5.,gridCenterPx.r + 100.);
                    mag = gridCenterPx.r + 100.;
                    vec2 vec = normalize(gridCenterPx.gb);

  
                    float lineD = sdSegment(gv, -vec * mag, vec * mag);
                    float line = smoothstep(-0.18,-0.01,lineD ) * smoothstep(0.18, 0.01, lineD);

                    float d = texture(field, uv).r;
                    float d_mag = smoothstep(-1.,1.,d + 100.);
                    float threshLine = smoothstep(0.498,0.499, d_mag) * smoothstep(0.502,0.501, d_mag);

                    //outColor = vec4(vec3(gv.x,gv.y,0.), 1.0);
                    outColor = vec4(vec3(line, line, line) * 0.3, 1.0);
                    outColor += vec4(vec3(threshLine) * 0.5, 1.0);
                }
                `,
                textures: {
                    field: {
                        filter: "nearest",
                        wrap: "clamp",
                    }
                },
            }),
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
                    float d_prev = prevPx.r;
                    vec2 C = vec2((posX / 100.0), (posY / 100.0));
                    float R = radius / 100.0;
                    // adjust C so that the circle can leave the screen (extend by radius in all directions)
                    C = vec2(C.x, C.y);
                    vec2 P  = vec2(uv.x * aspect, uv.y);
                    vec2 Pc = vec2(C.x * aspect,  C.y);

                    vec2 v = P - Pc;
                    float lenv = length(v);
                    float d_new = (lenv - R) - 100.;
                    vec2 g = v / lenv;
                    vec3 o = smin(vec3(d_new,g.x,g.y), prevPx.rgb, 0.1);
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
            out: Texture({
                signature: canvasSig,
                drawOps: [
                    {
                        program: ref("p_visField"),
                        vertex: quad,
                        globals: {
                            c: compositionGlobal,
                        },
                        textures: {
                            field: ref("sdfOut"),
                        }
                    },
                ],
            })
        }
    })
}

export default Main;