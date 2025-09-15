import { TextureSignature, Texture, Program, Instance, InstanceSignature } from "../../../../LibrariesAndUtils/NectarGL/Builder";
import build from "../../../../LibrariesAndUtils/NectarGL/Builder/build";
import computeConstraintPass_fs from './computeConstraintPass_fs.glsl';
import computeNewPos_fs from './computeNewPos_fs.glsl';
import drawLineSegment_vs from './drawLineSegment_vs.glsl';
import drawLineSegment_fs from './drawLineSegment_fs.glsl';

const defaultVS = `
                    out vec2 uv;
                    void main() {
                        uv = (position.xy + 1.0) * 0.5;
                        gl_Position = vec4(position, 0.0, 1.0);
                    }
                `;


const get_constraint = (ref,compositionGlobal,raytunnelGlobal,quad,input) => {
    return Texture({
                signature: ref("state_sig"),
                drawOps: [{
                    program: ref("p_compute_constraint_pass"),
                    vertex: quad,
                    globals: {g: compositionGlobal, r: raytunnelGlobal},
                    textures: {
                        src: input
                    }
                }],
    })
}

function Rope({
    compositionGlobalSig,
    compositionGlobal,
    raytunnelGlobal,
    raytunnelGlobalSig,
    quad,
    quadSig,
    canvasSig,
} : {
    compositionGlobalSig: string,
    compositionGlobal: string,
    raytunnelGlobal: string,
    raytunnelGlobalSig: string;
    quad: string,
    quadSig: string,
    canvasSig: string,
}) {
    return build(ref => {
        return {
            state_sig: TextureSignature({
                type: 'RGBA32F',
                size:[1000,1]
            }),
            p_compute_new_pos: Program({
                vertexShader: defaultVS,
                fragmentShader: computeNewPos_fs,
                globalSignatures: {
                    g: compositionGlobalSig,
                    r: raytunnelGlobalSig,
                },
                vertexSignature: quadSig,
                textures: {
                    lastPosTex: {
                        filter: "nearest",
                        wrap: "clamp"
                    },
                    curPosTex: {
                        filter: "nearest",
                        wrap: "clamp"
                    },
                }
            }),
            p_compute_constraint_pass: Program({
                vertexShader: defaultVS,
                fragmentShader: computeConstraintPass_fs,
                globalSignatures: {
                    g: compositionGlobalSig,
                    r: raytunnelGlobalSig,
                },
                vertexSignature: quadSig,
                textures: {
                    src: {
                        filter: "nearest",
                        wrap: "clamp"
                    }
                }
            }),
            p_put_new_pos: Program({
                vertexShader: defaultVS,
                fragmentShader: `
                    in vec2 uv;
                    void main() {
                        outColor = texture(src,uv);
                    }
                `,
                globalSignatures: {
                },
                vertexSignature: quadSig,
                textures: {
                    src: {
                        filter: "nearest",
                        wrap: "clamp"
                    }
                }
            }),
            new_pos: Texture({
                signature: ref("state_sig"),
                drawOps: [{
                    program: ref("p_compute_new_pos"),
                    vertex: quad,
                    globals: {g:compositionGlobal, r: raytunnelGlobal},
                    textures: {
                        lastPosTex: {
                            id: ref("outPos"),
                            latency: 2,
                        },
                        curPosTex: {
                            id: ref("outPos"),
                            latency: 1,
                        }
                    }
                }],
            }),
            constraint_1: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("new_pos")),
            constraint_2: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("constraint_1")),
            constraint_3: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("constraint_2")),
            constraint_4: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("constraint_3")),
            constraint_5: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("constraint_4")),
            constraint_6: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("constraint_5")),
            constraint_7: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("constraint_6")),
            constraint_8: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("constraint_7")),
            constraint_9: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("constraint_8")),
            constraint_10: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("constraint_9")),
            constraint_11: get_constraint(ref,compositionGlobal,raytunnelGlobal,quad, ref("constraint_10")),
            outPos: Texture({
                signature: ref("state_sig"),
                historyLength:3,
                drawOps: [{
                    program: ref("p_put_new_pos"),
                    vertex: quad,
                    globals: {},
                    textures: {
                        src: ref("constraint_11"),
                    }
                }]
            }),
            rope_seg_instance_sig: InstanceSignature({
                attributes: {},
                maxInstanceCount: 50000,
            }),
            rope_seg_instance: Instance({
                exportName: "rope_seg_instance",
                signature: ref("rope_seg_instance_sig")
            }),
            p_draw_rope: Program({
                vertexShader: drawLineSegment_vs,
                fragmentShader: drawLineSegment_fs,
                globalSignatures: {
                    g: compositionGlobalSig,
                    r: raytunnelGlobalSig,
                },
                vertexSignature: quadSig,
                instanceSignature: ref("rope_seg_instance_sig"),
                textures: {
                    data: {
                        filter: "nearest",
                        wrap: "clamp",
                    },
                    colorTex: {
                        filter: "nearest",
                        wrap: "clamp",
                    }
                }
            }),
            out: Texture({
                signature: canvasSig,
                drawOps: [{
                    program: ref("p_draw_rope"),
                    vertex: quad,
                    instance: ref("rope_seg_instance"),
                    globals: {g:compositionGlobal, r: raytunnelGlobal},
                    textures: {
                        data: ref("outPos"),
                    }
                }]
            }),
        };
    })
}
export default Rope;