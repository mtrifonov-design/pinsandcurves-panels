import type { Instance, Program, ResourceClass, Vertex, VertexSignature } from ".";
import TextureProvider from "../WebGLHelperLib/TextureProvider";
import { VariableResource } from "./BaseResources";
import SetupInstances from "./RenderPass/SetupInstances";
import SetupTextures from "./RenderPass/SetupTextures";
import SetupUniforms from "./RenderPass/SetupUniforms";
import SetupVertices from "./RenderPass/SetupVertices";
import type { DrawOperation, DynamicTextureData, StaticTextureData, TextureSignatureData } from "./types";

export class StaticTexture extends VariableResource {
    type = "StaticTexture";
    declare data : StaticTextureData;
    computeDependencies() { "do nothing" };
    textureProvider : TextureProvider;
    constructor(resources: Map<string, ResourceClass>,
        id: string,
        data: StaticTextureData,
        gl: WebGL2RenderingContext
    ) {
        super(resources,id,data,gl);
        const res = this.resources.get(this.data.signature) as undefined | ResourceClass;
        if (!res) throw new Error("Missing signature data");
        const sig = res.data as TextureSignatureData;
        this.textureProvider = new TextureProvider(gl, {
            shape: sig.size,
            type: sig.type,
            createFramebuffer: false,
        })
    }

    setTextureData(textureData: HTMLImageElement | Float32Array | Uint8Array) {
        this.textureProvider.setData(textureData);
        this.markAndPropagateDirty();
        this.dirty = false;
    }
};

export class DynamicTexture extends VariableResource {
    type = "DynamicTexture";
    declare data : DynamicTextureData;
    computeDependencies() {
        // compute dependsOn
        const drawOps = this.data.drawOps;
        const dependsOn = [];
        for (const drawOp of drawOps) {
            dependsOn.push(...Object.values(drawOp.textures));
        }
        this.dependsOn = dependsOn;

        // compute isDependencyOf
        const dynamicTextures = Array.from(this.resources.values()).filter(r => r.type === "DynamicTexture");
        //console.log("self",this.id)
        for (const texture of dynamicTextures) {
            let isDependencyOf = false;
            //console.log(texture.id)
            const textureDrawOps = texture.data.drawOps;
            for (const drawOp of textureDrawOps) {
                //console.log(Object.values(drawOp.textures))
                //console.log(Object.values(drawOp.textures).includes(this.id))
                if (Object.values(drawOp.textures).includes(this.id)) {
                    isDependencyOf = true;
                    break;
                }
            }
            if (isDependencyOf) {
                this.isDependencyOf.push(texture.id);
            }
        }
        //console.log("done",this.isDependencyOf)
    };
    textureProvider: TextureProvider;
    constructor(resources: Map<string, ResourceClass>,
        id: string,
        data: StaticTextureData,
        gl: WebGL2RenderingContext
    ) {
        super(resources,id,data,gl);
        const res = this.resources.get(this.data.signature) as undefined | ResourceClass;
        console.log(id)
        if (!res) throw new Error("Missing signature data");
        const sig = res.data as TextureSignatureData;
        this.textureProvider = new TextureProvider(gl, {
            shape: sig.size,
            type: sig.type,
            createFramebuffer: true,
        })
    }
    updateTextureData() {
        //console.log(this.dirty, this.id)
        if (!this.dirty) return;
        //console.log("Updating dynamic texture", this.id);
        //console.log(this.dependsOn);
        for (const dep of this.dependsOn) {
            const res = this.resources.get(dep) as undefined | ResourceClass;
            //console.log(res, res?.type, res.dirty);
            if (res && res.type === "DynamicTexture" && "dirty" in res && res.dirty) {
                (res as DynamicTexture).updateTextureData();
            }
        }
        this.performRenderPass();
        this.dirty = false;
    }

    performRenderPass() {
        //console.log("Performing render pass for", this.id);
        // Set up the texture we're drawing into.
        const res = this.resources.get(this.data.signature) as undefined | ResourceClass;
        if (!res) throw new Error("Missing signature data");
        const sig = res.data as TextureSignatureData;
        this.gl.viewport(0, 0, sig.size[0], sig.size[1]);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.textureProvider.framebuffer);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);

        for (const drawOp of this.data.drawOps) {
            if (drawOp.blend) {
                if (typeof drawOp.blend == "string") {
                    switch (drawOp.blend) {
                        case "add":
                            this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
                            break;
                        case "subtract":
                            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
                            break;
                        case "multiply":
                            this.gl.blendFunc(this.gl.DST_COLOR, this.gl.ZERO);
                            break;
                        case "screen":
                            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
                            break;
                        case "overlay":
                            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
                            break;
                        default:
                            throw new Error("blend mode not recognised");
                    }
                }

            } else {
                this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            }
            this.performDrawOp(drawOp);
        }

        this.gl.disable(this.gl.BLEND);
    }

    performDrawOp(drawOp : DrawOperation) {
        // set up vertices
        SetupVertices(this.gl, this.resources, drawOp.vertex);
        // get vertex attribute length
        const vertex = this.resources.get(drawOp.vertex) as undefined | Vertex;
        if (!vertex) throw new Error("Something went wrong.");
        const signatureId = vertex.data.signature;
        const vertexSignature = this.resources.get(signatureId) as undefined | VertexSignature;
        if (!vertexSignature) throw new Error("Something went wrong.");
        const vertexAttributeLength = Object.keys(vertexSignature.data.attributes).length;

        // set up instances (if applicable)
        if (drawOp.instance) {
            SetupInstances(this.gl, this.resources, drawOp.instance, vertexAttributeLength);
        }

        const program = this.resources.get(drawOp.program) as undefined | Program;
        if (!program) throw new Error("Something went wrong.");
        this.gl.useProgram(program.programProvider.program!);

        if (drawOp.global) {
            SetupUniforms(this.gl, this.resources, drawOp.global, program.programProvider.program!);
        }
        // set up textures
        SetupTextures(this.gl, this.resources, drawOp.textures, program.data, program.programProvider.program!);
        // perform draw call

        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertex.vertexProvider.vertexBuffer);
        // const bufferSize = this.gl.getBufferParameter(this.gl.ARRAY_BUFFER, this.gl.BUFFER_SIZE);
        // console.log("Vertex buffer size (bytes):", bufferSize);

        const instanced = drawOp.instance !== undefined;
        if (instanced) {
            const instance = this.resources.get(drawOp.instance!) as undefined | Instance;
            if (!instance) throw new Error("Something went wrong.");
            this.gl.drawElementsInstanced(
                this.gl.TRIANGLES,
                vertex.triangleCount * 3,
                this.gl.UNSIGNED_SHORT,
                0,
                instance.instanceCount
            );
        } else {
            this.gl.drawElements(
                this.gl.TRIANGLES,
                vertex.triangleCount * 3,
                this.gl.UNSIGNED_SHORT,
                0
            );
        }

    }


};