import { build, external, Global, GlobalSignature, Program, Texture, TextureSignature } from "../../NectarGL/Builder";
import putTexture from "../../StandardGraphics/putTexture";
import convertToStartTexture from './frag_convertToStartTexture.glsl';
import pass from './frag_pass.glsl';
import toFinalSDF from './frag_toFinalSDF.glsl';


function passProgram(quadSig: string, passNum: number) {
    return Program({
        vertexSignature: quadSig,
        globalSignatures: {},
        vertexShader: `
                out vec2 uv;
                void main() {
                    uv = position / 2. + vec2(0.5);
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
                `,
        fragmentShader: `
        float passNum = ${passNum}.0;
        ${pass}
        `,
        textures: {
            src: {
                filter: "nearest",
                wrap: "clamp",
            }
        },
    })
}

function performPass(ref, passNum: number, quad: string, quadSig: string) {
    return Texture({
        signature: ref("algoTexSig"),
        drawOps: [
            {
                program: ref(`p_pass${passNum}`),
                vertex: quad,
                globals: {},
                textures: {
                    src: passNum === 1 ? ref("startTexture") : ref(`pass${passNum - 1}`)
                }
            }
        ],
    })
}

function processSDF(ref,{
    quad,
    quadSig,
    inputStartTexture,
    sdfSig,
}) {
    return {
        algoTexSig: TextureSignature({
            type: "RGBA32F",
            size: [1024, 1024],
        }),
        p_convertToStartTexture: Program({
            vertexSignature: quadSig,
            globalSignatures: {},
            vertexShader: `
                out vec2 uv;
                void main() {
                    uv = position / 2. + vec2(0.5);
                    //uv.y = 1.0 - uv.y;
                    gl_Position = vec4(position.x, -position.y, 0.0, 1.0);
                }
                `,
            fragmentShader: convertToStartTexture,
            textures: {
                src: {
                    filter: "nearest",
                    wrap: "clamp",
                }
            },
        }),
        startTexture: Texture({
            signature: ref("algoTexSig"),
            drawOps: [
              {
                    program: ref("p_convertToStartTexture"),
                    vertex: quad,
                    globals: {},
                    textures: {
                        src:  inputStartTexture,
                    }
              }  
            ],
        }),
        pass1: performPass(ref, 1, quad, quadSig),
        pass2: performPass(ref, 2, quad, quadSig),
        pass3: performPass(ref, 3, quad, quadSig),
        pass4: performPass(ref, 4, quad, quadSig),
        pass5: performPass(ref, 5, quad, quadSig),
        pass6: performPass(ref, 6, quad, quadSig),
        pass7: performPass(ref, 7, quad, quadSig),
        pass8: performPass(ref, 8, quad, quadSig),
        pass9: performPass(ref, 9, quad, quadSig),
        pass10: performPass(ref, 10, quad, quadSig),
        p_pass1: passProgram(quadSig, 1),
        p_pass2: passProgram(quadSig, 2),
        p_pass3: passProgram(quadSig, 3),
        p_pass4: passProgram(quadSig, 4),
        p_pass5: passProgram(quadSig, 5),
        p_pass6: passProgram(quadSig, 6),
        p_pass7: passProgram(quadSig, 7),
        p_pass8: passProgram(quadSig, 8),
        p_pass9: passProgram(quadSig, 9),
        p_pass10: passProgram(quadSig, 10),
        p_toFinalSDF: Program({
            vertexSignature: quadSig,
            globalSignatures: {},
            vertexShader: `
                out vec2 uv;
                void main() {
                    uv = position / 2. + vec2(0.5);
                    uv.y = 1.0 - uv.y;
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
                `,
            fragmentShader: toFinalSDF,
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
                    program: ref("p_toFinalSDF"),
                    vertex: quad,
                    globals: {},
                    textures: {
                        src: ref("pass10")
                    }
                }
            ],
        })

    }
}

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
                    //outColor = texture(ext, uv);
                }
                `,
                textures: {
                    field: {
                        filter: "nearest",
                        wrap: "clamp",
                    },
                    // ext: {
                    //     filter: "linear",
                    //     wrap: "clamp",
                    // }
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
            externalInputTextureSig: TextureSignature({
                type: "RGBA8",
                size: [1024, 1024],
            }),
            externalInputTexture: Texture({
                signature: ref("externalInputTextureSig"),
                exportName: "externalInputTexture",
            }),
            ... processSDF(ref, {
                quad,
                quadSig,
                inputStartTexture: ref("externalInputTexture"),
                sdfSig,
            }),
            // sdfOut: Texture({
            //     signature: sdfSig,
            //     drawOps: [
            //         {
            //             program: ref("p_circle"),
            //             vertex: quad,
            //             globals: {
            //                 c: compositionGlobal,
            //                 s: signals,
            //             },
            //             textures: {
            //                 src: inputSDFTexture
            //             }
            //         },
            //     ],
            // }),
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
                            //ext: ref("externalInputTexture"),
                        }
                    },
                ],
            })
        }
    })
}

export default Main;