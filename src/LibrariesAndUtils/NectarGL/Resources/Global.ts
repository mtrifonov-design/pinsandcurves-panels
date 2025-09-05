import type { ResourceClass } from ".";
import UniformProvider from "../WebGLHelperLib/UniformProvider";
import { VariableResource } from "./BaseResources";
import type { GlobalData, GlobalSignatureData } from "./types";



export class Global extends VariableResource {
    type = "Global";
    declare data: GlobalData;
    computeDependencies() {
        const resourceArray = Array.from(this.resources.values());
        const dynamicTextures = resourceArray.filter(r => r.type === "DynamicTexture");
        for (const texture of dynamicTextures) {
            let isDependencyOf = false;
            const drawOps = texture.data.drawOps;
            for (const drawOp of drawOps) {
                if (drawOp.global && drawOp.global === this.id) {
                    isDependencyOf = true;
                    break;
                }
            }
            if (isDependencyOf) {
                this.isDependencyOf.push(texture.id);
            }
        }
    };
    uniformProvider : UniformProvider;
    constructor(
        resources: Map<string, ResourceClass>,
        id: string, 
        data: GlobalData, 
        gl: WebGL2RenderingContext) {
        super(resources, id, data, gl);
        const globalSignatureData = (() => {
            const obj = this.resources.get(this.data.signature);
            if (!obj) throw new Error("Uniform signature not found");
            return obj.data as GlobalSignatureData;
        })();
        const generateUniformStructure = () => {
            const uniformStructure = [];
            Object.entries(globalSignatureData).map(([name, value]) => {
                uniformStructure.push({ name, type: value });
            });
            return uniformStructure;
        };
        const uniformProviderSignature = {
            uniformProviderName: this.id,
            uniformStructure: generateUniformStructure(),
        };
        this.uniformProvider = new UniformProvider(gl,uniformProviderSignature);
        this.uniformProvider.setup();
    }
    setGlobals(globals: {
        [key: string]: number | number[];
    }) {
        this.uniformProvider.setUniforms(globals);
        this.markAndPropagateDirty();
        this.dirty = false;
    };
};