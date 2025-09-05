import type { ResourceClass, Vertex } from "..";
import { getBufferRowSize, getPropertyTypeSize, getPropertyTypeType } from "./VertexInstanceUtils";


export default function SetupVertices(gl: WebGL2RenderingContext,resources: Map<string, ResourceClass>, vertexId: string) {

    const vertex = resources.get(vertexId) as undefined | Vertex;
    if (!vertex) throw new Error("Something went wrong.");
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertex.vertexProvider.indexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex.vertexProvider.vertexBuffer);
    const vertexStructure = vertex.vertexProvider.vertexStructureObject;
    for (let i = 0; i < vertexStructure.length; i++) {
        const attribute = vertexStructure[i];
        const location = attribute.layoutIdx;
        gl.vertexAttribPointer(
            location, 
            getPropertyTypeSize(attribute.type), 
            getPropertyTypeType(attribute.type, gl), 
            false, 
            getBufferRowSize(vertexStructure), 
            getBufferRowSize(vertexStructure.slice(0, i)));
        gl.enableVertexAttribArray(location);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};