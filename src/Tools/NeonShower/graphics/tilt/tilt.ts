import { TextureSignature, Texture, Program } from "../../../../LibrariesAndUtils/NectarGL/Builder";
import build from "../../../../LibrariesAndUtils/NectarGL/Builder/build";


const compFrag = (self : number) => `

    in vec2 uv;
    void isActive() {
        // sample from src and compute.
        float sampledVal = texture(src,uv).r;
        float idx = floor(uv.x * 100.);
        float outVal = sampledVal + (1. / (255.  * 5.));
        outColor = vec4(outVal);
    }

    void isPassive() {
        // sample from src and pass on.
        float sampledVal = texture(src,uv).r;
        outColor = vec4(sampledVal); 
    }

    void main() {
        bool even = TOTAL_FRAME % 2 == 0;
        bool isA = ${self} == 0;

        if (even && isA) {
            isActive();
        } else if (!even && !isA) {
            isActive();
        } else {
            isPassive();    
        }
    }

`;

function Tilt({
    compositionGlobalSig,
    compositionGlobal,
    quad,
    quadSig,
} : {
    compositionGlobalSig: string,
    compositionGlobal: string,
    quad: string,
    quadSig: string,
}) {
    return build(ref => {
        return {
            state_sig: TextureSignature({
                type: 'RGBA32F',
                size:[100,1]
            }),
            p_compute_A: Program({
                vertexShader: `
                    out vec2 uv;
                    void main() {
                        uv = (position.xy + 1.0) * 0.5;
                        gl_Position = vec4(position, 0.0, 1.0);
                    }
                `,
                fragmentShader: compFrag(0),
                textures: {
                    src: {
                        filter: "nearest",
                        wrap: "clamp"
                    }
                },
                globalSignatures: {
                    g: compositionGlobalSig,
                },
                vertexSignature: quadSig,
            }),
            p_compute_B: Program({
                vertexShader: `
                    out vec2 uv;
                    void main() {
                        uv = (position.xy + 1.0) * 0.5;
                        gl_Position = vec4(position, 0.0, 1.0);
                    }
                `,
                fragmentShader: compFrag(1),
                textures: {
                    src: {
                        filter: "nearest",
                        wrap: "clamp"
                    }
                },
                globalSignatures: {
                    g: compositionGlobalSig,
                },
                vertexSignature: quadSig,
            }),
            p_copy: Program({
                vertexShader: `
                    out vec2 uv;
                    void main() {
                        uv = (position.xy + 1.0) * 0.5;
                        gl_Position = vec4(position, 0.0, 1.0);
                    }
                `,
                fragmentShader: `
                    in vec2 uv;
                    void main() {
                        bool even = TOTAL_FRAME % 2 == 0;
                        float sampledVal = 0.;
                        if (even) {
                            sampledVal = texture(src_A, uv).r;
                        } else {
                            sampledVal = texture(src_B, uv).r;
                        };
                        outColor = vec4(sampledVal);
                    }
                `,
                textures: {
                    src_A: {
                        filter: "nearest",
                        wrap: "clamp",
                    },
                    src_B: {
                        filter: "nearest",
                        wrap: "clamp",
                    },
                },
                globalSignatures: {
                    g: compositionGlobalSig,
                },
                vertexSignature: quadSig,
            }),
            state_A: Texture({
                signature: ref("state_sig"),
                drawOps: [{
                    program: ref("p_compute_B"),
                    vertex: quad,
                    globals: { g: compositionGlobal },
                    textures: {
                        src: ref("state_B"),
                    }
                }]
            }),
            state_B: Texture({
                signature: ref("state_sig"),
                drawOps: [{
                    program: ref("p_compute_A"),
                    vertex: quad,
                    globals: { g: compositionGlobal },
                    textures: {
                        src: ref("state_A"),
                    }
                }]
            }),
            out: Texture({
                signature: ref("state_sig"),
                drawOps: [{
                    program: ref("p_copy"),
                    vertex: quad,
                    globals: { g: compositionGlobal },
                    textures: {
                        src_A: ref("state_A"),
                        src_B: ref("state_B"),
                    }
                }]
            }),

        };
    })
}
export default Tilt;