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


function Main() {
    return build((ref: any) => ({
        quadSig: VertexSignature({
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
        drawDefault: Program({
            vertexShader: `
                out vec2 uv;
                void main() {
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                    uv = position.xy;
                }
            `,
            fragmentShader: `
                in vec2 uv;
                void main() {
                    float l = length(uv);
                    float radius = (playheadPosition / numberOfFrames) * 0.2;
                    float val = smoothstep(radius, radius + 0.1, l);
                    outColor = vec4(val, 0.0, 0.0, 1.0);
                }
            `,
            vertexSignature: ref('quadSig'),
            globalSignatures: {
                timeline: ref('timeline_sig')
            },
            textures: {},
        }),
        tsig: TextureSignature({
            type: 'RGBA8',
            size: [1920, 1080],
        }),
        quad: Vertex({ signature: ref('quadSig') }),
        timeline: Global({signature: ref('timeline_sig')}),
        out: Texture({ 
            signature: ref('tsig'),
            screen: true,
            drawOps: [
                {
                    program: ref('drawDefault'),
                    vertex: ref('quad'),
                    globals: {
                        timeline: ref('timeline')
                    },
                    textures: {}
                }
            ]
        }),

        // raytunnel: RayTunnel('raytunnel', { timeline: ref('timeline')}),
        // blur: Use(blurBuild),
    }));
}

export default Main;