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
    Use
 } from "../../../LibrariesAndUtils/NectarGL/Builder"

function RayTunnel({
    timeline, timeline_sig
}: {
    timeline: string,
    timeline_sig: string
}) {
    return build((ref: any) => ({
        global_sig: GlobalSignature({
            tunnelData: 'vec4',
            rayData: 'vec4',
            time: 'float',
            colorVarianceFactor: 'float',
            chaos: 'float',
        }),
        ray_sig: InstanceSignature({
            attributes: {
                seed: 'float',
            },
            maxInstanceCount: 50000
        }),
        quad_sig: VertexSignature({
            attributes: {
                position: 'vec2',
            },
            maxTriangleCount: 1024,
            maxVertexCount: 1024,
        }),
        global: Global({
            signature: ref('global_sig'),
        }),
        ray: Instance({
            signature: ref('ray_sig'),
        }),
        quad: Vertex({
            signature: ref('quad_sig'),
        }),
        colorTex_sig : TextureSignature({
            type: 'RGBA32F',
            size: [100,1],
        }),
        colorTex: Texture({
            signature: ref('colorTex_sig'),
        }),
        draw_ray: Program({
            vertexShader: '',
            fragmentShader: '',
            globalSignatures: {
                g: ref('global_sig'),
                t: timeline_sig
            },
            instanceSignature: ref('ray_sig'),
            vertexSignature: ref('quad_sig'),
            textures: {
                colorTex: {
                    filter: 'nearest',
                    clamp: 'wrap',
                }
            }
        }),
        out_sig: TextureSignature({
            type: 'RGBA8',
            size: [1920,1080],
        }),
        out: Texture({
            signature: ref('out_sig'),
            drawOps: [
            {
                program: ref('draw_ray'),
                vertex: ref('quad'),
                instance: ref('ray'),
                globals: {
                    g: ref('global'),
                    timeline: timeline
                },
                textures: {
                    colorTex: ref('colorTex')
                },
                blend: "add",
            }
            ]
        })
    }));
}

export default RayTunnel;