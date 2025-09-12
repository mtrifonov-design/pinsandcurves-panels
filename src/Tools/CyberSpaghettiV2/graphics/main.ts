import { build,
    VertexSignature,
    InstanceSignature,
    GlobalSignature,
    TextureSignature,
    Program,
    Vertex,
    Instance,
    Global,
    Texture,
    Use,
    exportResources,
    external
 } from "../../../LibrariesAndUtils/NectarGL/Builder"
import Blur from "./blur";
import RayTunnel from "./raytunnel";
import fog from './fog_fs.glsl';
import showerhead_vs from './showerhead_vs.glsl';

function Main() {
    return build((ref: any) => ({
        showerhead_tex_sig: TextureSignature({
            size: [1000,1000],
            type: "RGBA8",
        }),
        showerhead_tex: Texture({
            signature: ref('showerhead_tex_sig'),
            exportName: "cyberspag_showerhead"
        }),
        p_draw_showerhead: Program({
            vertexShader: showerhead_vs,
            fragmentShader: `
                in vec2 uv;
                void main() {
                    outColor = texture(src, uv) * vec4(1.) * 0.85 * showUI;
                }
            `,
            vertexSignature: external('quadSig'),
            globalSignatures: {
                c: external('compositionGlobalSig'),
                g: ref('raytunnel_global_sig'),
            },
            textures: {
                src: {
                    filter: "linear",
                    wrap: "repeat"
                }
            },
        }),
        p_draw_bg: Program({
            vertexShader: `
                out vec2 uv;
                void main() {
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                    uv = position.xy * 0.5 + 0.5;
                }
            `,
            fragmentShader: fog,
            vertexSignature: external('quadSig'),
            globalSignatures: {
                c: external('compositionGlobalSig'),
                g: ref('raytunnel_global_sig'),
            },
            textures: {
                src: {
                    filter: "nearest",
                    wrap: "repeat"
                }
            },
        }),
        raytunnel_tex: Texture({
            signature: external('canvasSig'),
            drawOps: [
                {
                    program: ref('raytunnel_draw_ray'),
                    vertex: external('quad'),
                    instance: ref('raytunnel_ray'),
                    globals: {
                        g: ref('raytunnel_global'),
                        t: external('compositionGlobal')
                    },
                    textures: {
                        colorTex: ref('raytunnel_colorTex')
                    },
                    blend: "add",
                }
            ]
        }),
        blur: Blur({
            quad: external('quad'),
            quadSig: external('quadSig'),
            inputTexture: ref('raytunnel_tex'),
            canvasSig: external('canvasSig'),
            compositionGlobal: external("compositionGlobal"),
            compositionGlobalSig: external("compositionGlobalSig")
        }),
        raytunnel: RayTunnel({ 
            timeline_sig: external('compositionGlobalSig'),
            quadSig: external('quadSig')
        }),
        p_fog: Program({
            vertexShader: `
                out vec2 uv;
                void main() {
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                    uv = position.xy * 0.5 + 0.5;
                }
            `,
            fragmentShader: fog,
            vertexSignature: external('quadSig'),
            globalSignatures: {
                c: external('compositionGlobalSig'),
                g: ref('raytunnel_global_sig'),
            },
            textures: {
                src: {
                    filter: "linear",
                    wrap: "repeat"
                }
            },
        }),
        out: Texture({
                signature: external("canvasSig"),
                drawOps: [
                    {
                        program: ref("p_draw_bg"),
                        vertex: external("quad"),
                        globals: {
                            c: external('compositionGlobal'),
                            g: ref('raytunnel_global')
                        },
                        textures: {
                            src: ref("raytunnel_colorTex")
                        },
                    },
                    {
                        program: ref("p_draw_showerhead"),
                        vertex: external("quad"),
                        globals: {
                            g: ref('raytunnel_global'),
                            c: external('compositionGlobal')
                        },
                        textures: {
                            src: ref("showerhead_tex")
                        },
                    },
                    {
                        program: ref("blur_p_drawTex"),
                        vertex: external("quad"),
                        globals: {
                        },
                        textures: {
                            src: ref("raytunnel_tex")
                        },
                        blend: "add",
                    },
                    {
                        program: ref("blur_p_drawTex"),
                        vertex: external("quad"),
                        globals: {
                        },
                        textures: {
                            src: ref("blur_out")
                        },
                        blend: "add"
                    }

                ],
            }),
        // blur: Use(blurBuild),
    }));
}

export default Main;