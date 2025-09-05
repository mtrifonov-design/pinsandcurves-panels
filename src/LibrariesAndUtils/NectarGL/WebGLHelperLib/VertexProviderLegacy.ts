

type VertexType = 
|'float'
|'vec2'
|'vec3'
|'vec4'
|'int'
|'ivec2'
|'ivec3'
|'ivec4';

type VertexProviderSignature = {
    vertexProviderName: string;
    vertexStructure: {
        name: string;
        type: VertexType;
        instanceAttribute?: boolean;
    }[];
    indexCount: number;
    vertexCount: number;
    instanceCount?: number;
    instancedCall?: boolean;
};

class VertexProvider {

    gl: WebGL2RenderingContext;
    vertexProviderSignature: VertexProviderSignature;
    constructor (gl: WebGL2RenderingContext, vertexProviderSignature: VertexProviderSignature) {
        this.gl = gl;
        if (!this.gl) {
            throw new Error('WebGL2RenderingContext is not provided');
        }
        this.vertexProviderSignature = vertexProviderSignature;
    }


    vertexBuffer: WebGLBuffer | null = null;
    indexBuffer: WebGLBuffer | null = null;
    instanceBuffer: WebGLBuffer | null = null;

    vao : WebGLVertexArrayObject | null = null;
    onlyVertexStructureObject: {
        name: string;
        type: VertexType;
        layoutIdx: number;
    }[] = [];
    onlyInstanceStructureObject: {
        name: string;
        type: VertexType;
        layoutIdx: number;
    }[] = [];

    setup() {
        this.vertexBuffer = this.gl.createBuffer();
        this.instanceBuffer = this.gl.createBuffer();
        this.indexBuffer = this.gl.createBuffer();
        if (!this.vertexBuffer || !this.instanceBuffer || !this.indexBuffer) {
            throw new Error('Failed to create vertex, instance or index buffer');
        }

        const derivedVertexStructureObject = [];
        for (let layoutIdx = 0; layoutIdx < this.vertexProviderSignature.vertexStructure.length; layoutIdx++) {
            const attribute = this.vertexProviderSignature.vertexStructure[layoutIdx];
            derivedVertexStructureObject.push({ ...attribute, layoutIdx });
        }



        const onlyVertexStructureObject = derivedVertexStructureObject.filter(attr => !attr.instanceAttribute);
        const onlyInstanceStructureObject = derivedVertexStructureObject.filter(attr => attr.instanceAttribute);
        this.onlyVertexStructureObject = onlyVertexStructureObject;
        this.onlyInstanceStructureObject = onlyInstanceStructureObject;

        // allocate the vertex buffer with the size of all attributes combined
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER, 
            this.vertexProviderSignature.vertexCount * this.getBufferRowSize(onlyVertexStructureObject), 
            this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        // allocate the index buffer with the size of all indices combined
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(
            this.gl.ELEMENT_ARRAY_BUFFER, 
            this.vertexProviderSignature.indexCount * Uint16Array.BYTES_PER_ELEMENT, 
            this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

        // allocate the instance buffer with the size of all attributes combined
        if (this.vertexProviderSignature.instanceCount && this.vertexProviderSignature.instancedCall) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
            this.gl.bufferData(
                this.gl.ARRAY_BUFFER, 
                this.vertexProviderSignature.instanceCount * this.getBufferRowSize(onlyInstanceStructureObject), 
                this.gl.DYNAMIC_DRAW);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        }

        // create the vertex array object
        this.vao = this.gl.createVertexArray();
        if (!this.vao) {
            throw new Error('Failed to create vertex array object');
        }
        for (let layoutIdx = 0; layoutIdx < this.vertexProviderSignature.vertexStructure.length; layoutIdx++) {
            this.gl.enableVertexAttribArray(layoutIdx);
        }

        this.gl.bindVertexArray(this.vao);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        for (const attribute of onlyVertexStructureObject) {
            const location = attribute.layoutIdx;
            const attrIdx = onlyVertexStructureObject.findIndex(attr => attr.name === attribute.name);
            this.gl.enableVertexAttribArray(location);
            this.gl.vertexAttribPointer(
                location, 
                this.getPropertyTypeSize(attribute.type),
                this.getPropertyTypeType(attribute.type, this.gl),
                false, 
                this.getBufferRowSize(onlyVertexStructureObject), 
                this.getBufferRowSize(onlyVertexStructureObject.slice(0, attrIdx)));
        }
        if (this.vertexProviderSignature.instanceCount && this.vertexProviderSignature.instancedCall) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
            for (const attribute of onlyInstanceStructureObject) {
                const location = attribute.layoutIdx;
                const attrIdx = onlyInstanceStructureObject.findIndex(attr => attr.name === attribute.name);
                this.gl.enableVertexAttribArray(location);
                this.gl.vertexAttribPointer(
                    location, 
                    this.getPropertyTypeSize(attribute.type),
                    this.getPropertyTypeType(attribute.type, this.gl),
                    false, 
                    this.getBufferRowSize(onlyInstanceStructureObject), 
                    this.getBufferRowSize(onlyInstanceStructureObject.slice(0, attrIdx)));
                this.gl.vertexAttribDivisor(location, 1); // make it instanced
            }
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindVertexArray(null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }


    private getPropertyTypeSize(type: VertexType): number {
        switch (type) {
            case 'float':
                return 1;
            case 'vec2':
                return 2;
            case 'vec3':
                return 3;
            case 'vec4':
                return 4;
            case 'int':
                return 1;
            case 'ivec2':
                return 2;
            case 'ivec3':
                return 3;
            case 'ivec4':
                return 4;
            default:
                throw new Error(`Unknown vertex type: ${type}`);
        }
    }

    private getPropertyTypeType(type: VertexType, gl: WebGL2RenderingContext): GLenum {
        switch (type) {
            case 'float':
            case 'vec2':
            case 'vec3':
            case 'vec4':
                return gl.FLOAT;
            case 'int':
            case 'ivec2':
            case 'ivec3':
            case 'ivec4':
                return gl.SHORT;
            default:
                throw new Error(`Unknown vertex type: ${type}`);    
        }
    }

    private getBufferRowSize(propertyStructure: {
        name: string;
        type: VertexType;
    }[]): number {
        return propertyStructure.reduce((acc, attr) => {
            switch (attr.type) {
                case 'float':
                case 'int':
                    return acc + 4;
                case 'vec2':
                case 'ivec2':
                    return acc + 8;
                case 'vec3':
                case 'ivec3':
                    return acc + 12;
                case 'vec4':
                case 'ivec4':
                    return acc + 16;
                default:
                    throw new Error(`Unknown vertex type: ${attr.type}`);
            }
        }, 0);
    }

    private setData(data: {
        [key: string]: number[]
    }, structureObject: {
        name: string;
        type: VertexType;
    }[], count: number,
    buffer: WebGLBuffer) {

        const bufferData = new ArrayBuffer(this.getBufferRowSize(structureObject) * count);
        for (let i = 0; i < count; i++) {
            for (const key of Object.keys(data)) {
                const attribute = structureObject.find(attr => attr.name === key);
                if (attribute) {
                    const offset = i * this.getBufferRowSize(structureObject) + this.getBufferRowSize(structureObject.slice(0, structureObject.indexOf(attribute)));
                    const view = new DataView(bufferData);
                    let setter: (value: number, offset: number) => void;
                    switch (attribute.type) {
                        case 'float':
                        case 'vec2':
                        case 'vec3':
                        case 'vec4':
                            setter = (value, offset) => view.setFloat32(offset, value, true);
                            break;
                        case 'int':
                        case 'ivec2':   
                        case 'ivec3':
                        case 'ivec4':
                            setter = (value, offset) => view.setInt32(offset, value, true);
                            break;
                        default:
                            throw new Error(`Unknown vertex type: ${attribute.type}`);
                    }
                    const values = data[key];
                    const size = this.getPropertyTypeSize(attribute.type);
                    for (let j = 0; j < size; j++) {
                        if (j < values.length) {
                            setter(values[i*size+j], offset + j * 4);
                        } 
                    }
                }
            }
        }
        if (!buffer) {
            throw new Error('Vertex buffer is not initialized. Call setup() first.');
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        // Log the buffer as floating point values for debugging
        //console.log('Setting vertex data:', new Float32Array(bufferData));
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, bufferData);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    setVertexData(data: {
        [key: string]: number[]
    }) {
        if (!this.vertexBuffer) {
            throw new Error('Vertex buffer is not initialized. Call setup() first.');
        }
        this.setData(
            data,
            this.onlyVertexStructureObject,
            this.vertexProviderSignature.vertexCount,
            this.vertexBuffer
        );
    }

    setInstanceData(data: {
        [key: string]: number[]
    }) {
        if (!this.vertexProviderSignature.instanceCount || !this.vertexProviderSignature.instancedCall) {
            throw new Error('This vertex provider does not support instanced rendering');
        }
        if (!this.instanceBuffer) {
            throw new Error('Instance buffer is not initialized. Call setup() first.');
        }
        this.setData(
            data,
            this.onlyInstanceStructureObject,
            this.vertexProviderSignature.instanceCount,
            this.instanceBuffer
        );
    }

    setIndexData(data: number[]) {
        if (!this.indexBuffer) {
            throw new Error('Index buffer is not initialized. Call setup() first.');
        }
        // check if vao is bound
        if (this.gl.getParameter(this.gl.VERTEX_ARRAY_BINDING) === this.vao) {
            throw new Error('Vertex array object is bound. This is not allowed at this point.');
        }
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        const indexData = new Uint16Array(data);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexData, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }

    
}


export default VertexProvider;
export type {VertexProviderSignature};