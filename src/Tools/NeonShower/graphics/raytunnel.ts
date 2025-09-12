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
    external,
    Use
 } from "../../../LibrariesAndUtils/NectarGL/Builder"
import ray_fs from './ray_fs.glsl';
import ray_vs from './ray_vs.glsl';


function RayTunnel({
    timeline_sig,
    quadSig
}: {
    timeline_sig: string,
    quadSig: string
}) {
    return build((ref: any) => ({
        global_sig: GlobalSignature({
            origin: 'vec4',
            temperature: 'float',
            pressure: 'float',
            showUI: 'float',
        }),
        ray_sig: InstanceSignature({
            attributes: {
            },
            maxInstanceCount: 50000
        }),
        global: Global({
            signature: ref('global_sig'),
            exportName: 'cyberspag_globals'
        }),
        ray: Instance({
            signature: ref('ray_sig'),
            exportName: 'cyberspag_ray'
        }),
        colorTex_sig : TextureSignature({
            type: 'RGBA32F',
            size: [100,1],
        }),
        colorTex: Texture({
            signature: ref('colorTex_sig'),
            exportName: 'cyberspag_colorTexture'
        }),
        draw_ray: Program({
            vertexShader: ray_vs,
            fragmentShader: ray_fs,
            globalSignatures: {
                g: ref('global_sig'),
                t: timeline_sig
            },
            instanceSignature: ref('ray_sig'),
            vertexSignature: quadSig,
            textures: {
                colorTex: {
                    filter: 'nearest',
                    clamp: 'wrap',
                }
            }
        })
    }));
}

export default RayTunnel;