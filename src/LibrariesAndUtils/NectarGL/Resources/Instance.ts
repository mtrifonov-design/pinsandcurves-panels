import InstanceProvider from "../WebGLHelperLib/InstanceProvider";
import { VariableResource } from "./BaseResources";
import type { InstanceData, InstanceSignatureData
 } from "./types";
 import type { ResourceClass } from ".";

export class Instance extends VariableResource {
    type = "Instance";
    declare data : InstanceData;
    computeDependencies() {
        const resourceArray = Array.from(this.resources.values());
        const dynamicTextures = resourceArray.filter(r => r.type === "DynamicTexture");
        for (const texture of dynamicTextures) {
            let isDependencyOf = false;
            const drawOps = texture.data.drawOps;
            for (const drawOp of drawOps) {
                if (drawOp.instance && drawOp.instance === this.id) {
                    isDependencyOf = true;
                    break;
                }
            }
            if (isDependencyOf) {
                this.isDependencyOf.push(texture.id);
            }
        }
    };
    instanceProvider : InstanceProvider;
    constructor(resources: Map<string, ResourceClass>,
        id: string,
        data : InstanceData,
        gl: WebGL2RenderingContext
    ) {
        super(resources,id,data,gl);
        const res = this.resources.get(data.signature) as undefined | ResourceClass;
        //console.log(data.signature);
        if (!res) throw new Error("Signature not found");
        const sig = res.data as InstanceSignatureData;
        const instanceProviderSignature = {
            maxInstanceCount: sig.maxInstanceCount,
            instanceProviderName: id,
            instanceStructure: (() => {
                const structure = [];
                for (const [attr, type] of Object.entries(sig.attributes)) {
                    structure.push({ name: attr, type });
                }
                return structure;
            })()
        };
        this.instanceProvider = new InstanceProvider(gl,instanceProviderSignature);
    }
    instanceCount = 0;
    setInstanceData(instanceData: {
        [key: string]: number[];
    }, instanceCount: number) {
        this.instanceProvider.setInstanceData(instanceData);
        this.instanceCount = instanceCount;
        this.markAndPropagateDirty();
        this.dirty = false;
    };
};