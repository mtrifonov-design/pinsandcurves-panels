

import type { UniformProviderSignature } from "./UniformProvider";
import UniformProvider from "./UniformProvider";
import type { VertexProviderSignature } from "./VertexProvider";
import VertexProvider from "./VertexProvider";
import Texture from "./Texture";

type ProgramDescription = {
    vertexShader: string;
    fragmentShader: string;
    uniformProviderSignature: UniformProviderSignature;
    vertexProviderSignature: VertexProviderSignature;
};

type ProgramDrawCall = {
    uniformProvider: UniformProvider;
    vertexProvider: VertexProvider;
    textures: {
        [texName: string]: Texture;
    }
}


function generateUniformBlockString(uniformProvider: UniformProviderSignature) {
    let block = `layout(std140) uniform ${uniformProvider.uniformProviderName} {\n`;
    for (const uniform of uniformProvider.uniformStructure) {
        block += `    ${uniform.type} ${uniform.name};\n`;
    }
    block += `};\n`;
    return block;
}

function generateVertexBlockString(vertexProvider: VertexProviderSignature) {
    let block = "";
    for (let i = 0; i < vertexProvider.vertexStructure.length; i++) {
        const vertex = vertexProvider.vertexStructure[i];
        block += `layout(location = ${i}) in ${vertex.type} ${vertex.name};\n`;
    }
    return block;
}

class Program {
    gl: WebGL2RenderingContext;
    programDescription: ProgramDescription;
    program: WebGLProgram | null = null;
    constructor(gl : WebGL2RenderingContext, programDes: ProgramDescription) {
        this.gl = gl;
        if (!this.gl) {
            throw new Error('WebGL2RenderingContext is not provided');
        }
        this.programDescription = programDes;
    }

    setup() {
        const vertexShaderSource = `#version 300 es
        precision mediump float;
        ${generateUniformBlockString(this.programDescription.uniformProviderSignature)}
        ${generateVertexBlockString(this.programDescription.vertexProviderSignature)}
        ${this.programDescription.vertexShader}
        `;

        const fragmentShaderSource = `#version 300 es
        precision mediump float;
        ${generateUniformBlockString(this.programDescription.uniformProviderSignature)}
        ${this.programDescription.fragmentShader}
        `;

        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        if (!vertexShader) {
            throw new Error('Failed to create vertex shader');
        }
        this.gl.shaderSource(vertexShader, vertexShaderSource);
        this.gl.compileShader(vertexShader);
        if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(vertexShader);
            this.gl.deleteShader(vertexShader);
            throw new Error(`Vertex shader compilation failed: ${error}`);
        }
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        if (!fragmentShader) {
            throw new Error('Failed to create fragment shader');
        }
        this.gl.shaderSource(fragmentShader, fragmentShaderSource);
        this.gl.compileShader(fragmentShader);
        if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(fragmentShader);
            this.gl.deleteShader(fragmentShader);
            throw new Error(`Fragment shader compilation failed: ${error}`);
        }
        this.program = this.gl.createProgram();
        if (!this.program) {
            throw new Error('Failed to create program');
        }
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(this.program);
            this.gl.deleteProgram(this.program);
            throw new Error(`Program linking failed: ${error}`);
        }
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
    }

    draw(pdc: ProgramDrawCall) {
        const { uniformProvider, vertexProvider } = pdc;
        if (!this.program) {
            throw new Error('Program is not set up');
        }
        this.gl.useProgram(this.program);

        // bind uniform buffer
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, uniformProvider.buffer);
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, 0, uniformProvider.buffer);
        const index = this.gl.getUniformBlockIndex(this.program, uniformProvider.uniformProviderName);
        if (index === -1) {
            throw new Error(`Uniform block ${uniformProvider.uniformProviderName} not found in program`);
        }
        this.gl.uniformBlockBinding(this.program, index, 0);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);

        // bind vertex attributes
        this.gl.bindVertexArray(vertexProvider.vao);
        if (vertexProvider.vertexProviderSignature.instancedCall) {
            this.gl.drawElementsInstanced(
                this.gl.TRIANGLES,
                vertexProvider.vertexProviderSignature.indexCount,
                this.gl.UNSIGNED_SHORT,
                0,
                vertexProvider.vertexProviderSignature.instanceCount!
            );
        } else {
            this.gl.drawElements(
                this.gl.TRIANGLES,
                vertexProvider.vertexProviderSignature.indexCount,
                this.gl.UNSIGNED_SHORT,
                0
            )
        }
    }
}

export default Program;
export type { ProgramDescription, ProgramDrawCall };