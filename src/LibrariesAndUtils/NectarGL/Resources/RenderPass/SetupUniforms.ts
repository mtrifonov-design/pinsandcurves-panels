import { Global, type ResourceClass } from "..";
import type { GlobalSignatureData } from "../types";

export default function SetupUniforms(gl: WebGL2RenderingContext,resources: Map<string, ResourceClass>, globalId: string, program: WebGLProgram) {
    const global = resources.get(globalId) as undefined | Global;
    if (!global) throw new Error("Something went wrong.");
    const globalSignature = resources.get(global.data.signature) as undefined | GlobalSignatureData;
    if (!globalSignature) throw new Error("Something went wrong.");
    const uniformProvider = global.uniformProvider;

    gl.bindBuffer(gl.UNIFORM_BUFFER, uniformProvider.buffer);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uniformProvider.buffer);

    const uniformBlockIndex = gl.getUniformBlockIndex(program, globalSignature.id);
    if (uniformBlockIndex === -1) throw new Error("Something went wrong.");
    gl.uniformBlockBinding(program, uniformBlockIndex, 0);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
};