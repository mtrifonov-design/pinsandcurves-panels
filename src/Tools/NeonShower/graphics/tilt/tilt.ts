import { TextureSignature, Texture, Program } from "../../../../LibrariesAndUtils/NectarGL/Builder";
import build from "../../../../LibrariesAndUtils/NectarGL/Builder/build";

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
            p_compute: Program({
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
                        outColor = texture(src,uv) + vec4(1.0 / (255. * 5.));
                    }
                `,
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
            out: Texture({
                signature: ref("state_sig"),
                historyLength:2,
                drawOps: [{
                    program: ref("p_compute"),
                    vertex: quad,
                    globals: { g: compositionGlobal },
                    textures: {
                        src: {
                            id: ref("out"),
                            latency: 1,
                        },
                    }
                }]
            }),
        };
    })
}
export default Tilt;