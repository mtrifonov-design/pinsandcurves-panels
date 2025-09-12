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
import RayTunnel from "./raytunnel";

const exported = exportResources(RayTunnel({ timeline: external("timeline"), timeline_sig:  external("timeline_sig") }));
console.log(exported)

function Main() {
    return build((ref: any) => ({
        vsig: VertexSignature({
            attributes: {
                position: 'vec2',
            },
            maxVertexCount: 1024,
            maxTriangleCount: 2048,
        }),
        timeline_sig: GlobalSignature({
            playheadPosition: 'float',
            numberOfFrames: 'float',
            rendering: 'int'
        }),
        isig: InstanceSignature({
            attributes: {
                col: 'vec4',
                instancePosition: 'vec2',
                radius: 'float'
            },
            maxInstanceCount: 64,
        }),
        gsig: GlobalSignature({
            screenSize: 'vec2',
            blurScale: 'float',
        }),
        tsig: TextureSignature({
            type: 'RGBA8',
            size: [1920, 1080],
        }),
        v: Vertex({ signature: ref('vsig') }),
        i: Instance({ signature: ref('isig') }),
        g: Global({ signature: ref('gsig') }),
        timeline: Global({signature: ref('timeline_sig')}),
        //raytunnel: RayTunnel({ timeline: ref('timeline'), timeline_sig: ref('timeline_sig') }),
        raytunnel: Use(exported, {
            timeline: ref('timeline'),
            timeline_sig: ref('timeline_sig')
        })

        // raytunnel: RayTunnel('raytunnel', { timeline: ref('timeline')}),
        // blur: Use(blurBuild),
    }));
}

export default Main;