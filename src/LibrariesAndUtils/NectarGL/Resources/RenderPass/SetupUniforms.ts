import { Global, Program, type ResourceClass } from "..";
import type { GlobalSignatureData } from "../types";

export default function SetupUniforms(gl: WebGL2RenderingContext,resources: Map<string, ResourceClass>, globalIds: { [key:string] : string}, program: Program) {
    let i = 0;
    for (const [key, globalId] of Object.entries(globalIds)) {
        const global = resources.get(globalId) as undefined | Global;
        if (!global) throw new Error("Something went wrong.");
        const globalSignature = resources.get(global.data.signature) as undefined | GlobalSignatureData;
        if (!globalSignature) throw new Error("Something went wrong.");
        const uniformProvider = global.uniformProvider;
        const webglprogram = program.programProvider.program!;

        // check if signature associated to this global matches signature stored in program
        const programGlobalId = program.data.globalSignatures[key];
        if (programGlobalId !== global.data.signature) {
            throw new Error("Global signature does not match program signature.");
        }

        gl.bindBuffer(gl.UNIFORM_BUFFER, uniformProvider.buffer);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, i, uniformProvider.buffer);

        const uniformBlockIndex = gl.getUniformBlockIndex(webglprogram, key);
        if (uniformBlockIndex === -1) throw new Error("Something went wrong.");
        gl.uniformBlockBinding(webglprogram, uniformBlockIndex, i);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        i++;    
    }
};