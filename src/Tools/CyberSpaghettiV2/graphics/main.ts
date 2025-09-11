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
                        program: ref("blur_p_drawTex"),
                        vertex: external("quad"),
                        globals: {
                        },
                        textures: {
                            src: ref("raytunnel_tex")
                        },
                    },
                    // {
                    //     program: ref("p_fog"),
                    //     vertex: external("quad"),
                    //     globals: {
                    //         g: ref('raytunnel_global'),
                    //         c: external('compositionGlobal')
                    //     },
                    //     textures: {
                    //         src: ref("blur_out")
                    //     },
                    //     blend: "add"
                    // },
                    {
                        program: ref("blur_p_drawTex"),
                        vertex: external("quad"),
                        globals: {
                        },
                        textures: {
                            src: ref("blur_out")
                        },
                        blend: "add"
                    },
                    {
                        program: ref("blur_p_drawTex"),
                        vertex: external("quad"),
                        globals: {
                        },
                        textures: {
                            src: ref("showerhead_tex")
                        },
                        blend: "add"
                    },
                ],
            }),
        // blur: Use(blurBuild),
    }));
}

export default Main;