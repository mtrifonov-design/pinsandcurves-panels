import { build, Program, Texture } from "../../../LibrariesAndUtils/NectarGL/Builder";


function Viewport({
    inputTexture,
    compositionGlobal,
    quad,
    quadSig,
    canvasSig,
    compositionGlobalSig,
}: {
    inputTexture: string,
    compositionGlobal: string,
    quad: string,
    canvasSig: string,
    compositionGlobalSig: string,
    quadSig: string
}) {
    return build(ref => {
        return {
            screenDraw: Program({
                vertexSignature: quadSig,
                globalSignatures: {
                    g: compositionGlobalSig,
                },
                vertexShader: `
                    out vec2 uv;
                    void main() {
                    float cw = screen.x;
                    float ch = screen.y;
                    float iw = canvas.x;
                    float ih = canvas.y;

                    float a_img  = iw / ih;
                    float a_cont = cw / ch;

                    vec2 sizeNDC;
                    if (a_img > a_cont) {
                        sizeNDC = vec2(2.0, 2.0 * (a_cont / a_img));
                    } else {
                        sizeNDC = vec2(2.0 * (a_img / a_cont), 2.0);
                    }

                    vec2 scale = sizeNDC * 0.5;
                    gl_Position = vec4(position * scale, 0.0, 1.0);
                    uv = position * 0.5 + 0.5;
                    }

                `,
                fragmentShader: `
                    in vec2 uv;
                    void main() {
                        outColor = texture(inputTex, uv);
                        //outColor = vec4(1.0,0.0,0.0,1.0);
                    }
                `,
                textures: {
                    inputTex: {
                        wrap: "clamp",
                        filter: "linear"
                    }
                }
            }),
            screenTex: Texture({
                signature: canvasSig,
                screen: true,
                drawOps: [{
                    vertex: quad,
                    globals: {
                        g: compositionGlobal,
                    },
                    textures: {
                        inputTex: inputTexture
                    },
                    program: ref("screenDraw")
                }]
            }),
        }
    })
};

export default Viewport;