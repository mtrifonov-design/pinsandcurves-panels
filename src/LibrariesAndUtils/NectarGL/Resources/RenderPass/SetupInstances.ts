import type { Instance, ResourceClass } from "..";
import { getBufferRowSize, getPropertyTypeSize, getPropertyTypeType } from "./VertexInstanceUtils";

export default function SetupInstances(gl: WebGL2RenderingContext, resources: Map<string, ResourceClass>, instanceId: string, instanceAttributeLength: number) {
    const l = instanceAttributeLength;
    const instance = resources.get(instanceId) as undefined | Instance;
    if (!instance) throw new Error("Something went wrong.");
    gl.bindBuffer(gl.ARRAY_BUFFER, instance.instanceProvider.instanceBuffer);
    const instanceStructure = instance.instanceProvider.instanceStructureObject;
    for (let i = 0; i < instanceStructure.length; i++) {
        const attribute = instanceStructure[i];
        const location = l + attribute.layoutIdx;
        gl.vertexAttribPointer(
            location,
            getPropertyTypeSize(attribute.type),
            getPropertyTypeType(attribute.type, gl),
            false,
            getBufferRowSize(instanceStructure),
            getBufferRowSize(instanceStructure.slice(0, i)));
        gl.enableVertexAttribArray(location);
        gl.vertexAttribDivisor(location, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};