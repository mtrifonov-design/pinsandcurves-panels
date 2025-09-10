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
                    float radius = (playheadPosition / numberOfFrames) * 1.2;
                    float val = smoothstep(radius, radius + 0.1, l);
                    outColor = vec4(val, 0.0, 0.0, 1.0);
                }
            `,
            vertexSignature: external('quadSig'),
            globalSignatures: {
                timeline: external('compositionGlobalSig'),
            },
            textures: {},
        }),
        out: Texture({
            signature: external('canvasSig'),
            drawOps: [
                {
                    program: ref('drawDefault'),
                    vertex: external('quad'),
                    globals: {
                        timeline: external('compositionGlobal')
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