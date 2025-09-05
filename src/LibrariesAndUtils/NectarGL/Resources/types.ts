type WebGLPrimitiveType =
| "float"
| "int"
| "vec2"
| "vec4"
type VertexSignatureData = {
    attributes : {
        [key: string]: WebGLPrimitiveType;
    },
    maxVertexCount: number;
    maxTriangleCount: number;
};
type InstanceSignatureData = {
    attributes: {
        [key: string]: WebGLPrimitiveType;
    },
    maxInstanceCount: number;
};
type GlobalSignatureData = {
    [key: string]: WebGLPrimitiveType;
};
type TextureSignatureData = {
    type: "RGBA8" | "RGBA32F" | "R8" | "R32F";
    size: [number, number];
};
type VertexData = {
    signature: string;
};
type InstanceData = {
    signature: string;
};
type GlobalData = {
    signature: string;
};
type StaticTextureData = {
    signature: string;
};
type ProgramData = {
    vertexSignature: string;
    instanceSignature?: string;
    globalSignature?: string;
    textures: {
        [key: string]: {
            filter: "nearest" | "linear";
            wrap: "repeat" | "clamp";
        };
    };
    vertexShader: string;
    fragmentShader: string;
};
type DrawOperation = {
    program: string;
    vertex: string;
    instance?: string;
    global?: string;
    textures: {
        [key: string]: string;
    };
};
type DynamicTextureData = {
    signature: string;
    drawOps: DrawOperation[];
};
export type {
    WebGLPrimitiveType,
    VertexSignatureData,
    InstanceSignatureData,
    GlobalSignatureData,
    TextureSignatureData,
    VertexData,
    InstanceData,
    GlobalData,
    StaticTextureData,
    ProgramData,
    DrawOperation,
    DynamicTextureData
}