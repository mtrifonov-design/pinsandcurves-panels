import type { ResourceClass } from ".";
import { PersistentResource } from "./BaseResources";
import type { GlobalSignatureData, InstanceSignatureData, ProgramData, VertexSignatureData } from "./types";
import ProgramProvider from "../WebGLHelperLib/ProgramProvider";

export class Program extends PersistentResource {
    type = "Program";

    dispose() {
        this.programProvider.dispose();
    }

    declare data: ProgramData;
    programProvider: ProgramProvider;
    constructor(resources: Map<string, ResourceClass>, id: string, data: ProgramData, gl: WebGL2RenderingContext) {
        super(resources, id, data, gl);
        this.programProvider = new ProgramProvider(gl, {
            vertexShader: data.vertexShader,
            fragmentShader: data.fragmentShader,
            uniformProviderSignatures: (() => {
                return Object.keys(data.globalSignatures).map(signatureKey => {
                    const signature = data.globalSignatures[signatureKey];
                    const res = this.resources.get(signature) as undefined | ResourceClass;
                    if (!res) throw new Error(`Global signature ${signature} not found for program ${id}`);
                    const sig = res.data as GlobalSignatureData;
                    const uniformStructure = [];
                    for (const [name, type] of Object.entries(sig)) {
                        uniformStructure.push({ name, type });
                    }
                    return { uniformProviderName: signatureKey, uniformStructure };
                });
            })(),
            vertexProviderSignature: (() => {
                const res = this.resources.get(data.vertexSignature) as undefined | ResourceClass;
                if (!res) throw new Error(`Vertex signature ${data.vertexSignature} not found for program ${id}`);
                const sig = res.data as VertexSignatureData;
                const vertexStructure = [];
                for (const [name, type] of Object.entries(sig.attributes)) {
                    vertexStructure.push({ name, type });
                }
                return {
                    vertexProviderName: data.vertexSignature, vertexStructure,
                    maxTriangleCount: sig.maxTriangleCount,
                    maxVertexCount: sig.maxVertexCount
                };
            })(),
            instanceProviderSignature: (() => {
                if (data.instanceSignature) {
                    const res = this.resources.get(data.instanceSignature) as undefined | ResourceClass;
                    if (!res) throw new Error(`Instance signature ${data.instanceSignature} not found for program ${id}`);
                    const sig = res.data as InstanceSignatureData;
                    const instanceStructure = [];
                    for (const [name, type] of Object.entries(sig.attributes)) {
                        instanceStructure.push({ name, type });
                    }
                    return {
                        instanceProviderName: data.instanceSignature, instanceStructure,
                        maxInstanceCount: sig.maxInstanceCount
                    };
                } else return undefined;
            })(),
            textureNames: Object.keys(data.textures || {})
        });
    }
}