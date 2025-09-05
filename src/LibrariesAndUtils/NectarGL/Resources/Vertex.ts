import type { ResourceClass } from ".";
import VertexProvider from "../WebGLHelperLib/VertexProvider";
import { VariableResource } from "./BaseResources";
import type { VertexData, VertexSignatureData } from "./types";

export class Vertex extends VariableResource {
    type = "Vertex";
    declare data : VertexData;
    computeDependencies() {
        const resourceArray = Array.from(this.resources.values());
        const dynamicTextures = resourceArray.filter(r => r.type === "DynamicTexture");
        for (const texture of dynamicTextures) {
            let isDependencyOf = false;
            const drawOps = texture.data.drawOps;
            for (const drawOp of drawOps) {
                if (drawOp.vertex && drawOp.vertex === this.id) {
                    isDependencyOf = true;
                    break;
                }
            }
            if (isDependencyOf) {
                this.isDependencyOf.push(texture.id);
            }
        }
    };

    vertexProvider : VertexProvider;
    constructor(resources: Map<string, ResourceClass>, id: string, data: VertexData, gl: WebGL2RenderingContext) {
        super(resources, id,data, gl);
        const res = this.resources.get(data.signature) as undefined | ResourceClass;
        //console.log(data.signature);
        if (!res) throw new Error("Signature not found");
        const sig = res.data as VertexSignatureData;
        const vertexProviderSignature = {
            maxVertexCount: sig.maxVertexCount,
            maxTriangleCount : sig.maxTriangleCount,
            vertexStructure: (() => {
                const structure = [];
                for (const [name, type] of Object.entries(sig.attributes)) {
                    structure.push({ name, type });
                }
                return structure;
            })(),
            vertexProviderName: id
        };
        //console.log("Creating vertex provider with signature:", vertexProviderSignature);
        this.vertexProvider = new VertexProvider(gl,vertexProviderSignature);
    }
    triangleCount = 0;
    setVertices(vertices: {
        [key: string]: number[];
    }, indices: number[], triangleCount: number) {
        this.vertexProvider.setVertexData(vertices);
        this.vertexProvider.setIndexData(indices);
        this.triangleCount = triangleCount;
        this.markAndPropagateDirty();
        this.dirty = false;
    };
};