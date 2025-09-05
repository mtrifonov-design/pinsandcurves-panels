

import type { UniformProviderSignature } from "./UniformProvider";
import type { VertexProviderSignature } from "./VertexProvider";
import type { InstanceProviderSignature } from "./InstanceProvider";

type ProgramDescription = {
    vertexShader: string;
    fragmentShader: string;
    uniformProviderSignature?: UniformProviderSignature;
    vertexProviderSignature: VertexProviderSignature;
    instanceProviderSignature?: InstanceProviderSignature;
    textureNames: string[];
};

function generateUniformBlockString(uniformProvider: UniformProviderSignature) {
    let block = `layout(std140) uniform ${uniformProvider.uniformProviderName} {\n`;
    for (const uniform of uniformProvider.uniformStructure) {
        block += `    ${uniform.type} ${uniform.name};\n`;
    }
    block += `};\n`;
    return block;
}

function generateVertexBlockString(vertexProvider: VertexProviderSignature, instanceProvider?: InstanceProviderSignature) {
    let block = "";
    for (let i = 0; i < vertexProvider.vertexStructure.length; i++) {
        const vertex = vertexProvider.vertexStructure[i];
        block += `layout(location = ${i}) in ${vertex.type} ${vertex.name};\n`;
    }
    if (instanceProvider) {
        for (let i = 0; i < instanceProvider.instanceStructure.length; i++) {
            const instance = instanceProvider.instanceStructure[i];
            block += `layout(location = ${i + vertexProvider.vertexStructure.length}) in ${instance.type} ${instance.name};\n`;
        }
    }
    //console.log(block);
    return block;
}

class ProgramProvider {
    gl: WebGL2RenderingContext;
    programDescription: ProgramDescription;
    program: WebGLProgram | null = null;
    constructor(gl : WebGL2RenderingContext, programDes: ProgramDescription) {
        this.gl = gl;
        if (!this.gl) {
            throw new Error('WebGL2RenderingContext is not provided');
        }
        this.programDescription = programDes;
        this.setup();
    }

    setup() {
        const vertexShaderSource = `#version 300 es
        precision mediump float;
        precision mediump int;
        ${this.programDescription.uniformProviderSignature?generateUniformBlockString(this.programDescription.uniformProviderSignature):''}
        ${generateVertexBlockString(this.programDescription.vertexProviderSignature,this.programDescription.instanceProviderSignature)}
        ${this.programDescription.vertexShader}
        `;

        const fragmentShaderSource = `#version 300 es
        precision mediump float;
        precision mediump int;
        out vec4 outColor;
        ${this.programDescription.uniformProviderSignature?generateUniformBlockString(this.programDescription.uniformProviderSignature):''}
        ${this.programDescription.textureNames.map(name => `uniform sampler2D ${name};`).join('\n')}
        ${this.programDescription.fragmentShader}
        `;
        //console.log(vertexShaderSource)
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
}

export default ProgramProvider;
export type { ProgramDescription };