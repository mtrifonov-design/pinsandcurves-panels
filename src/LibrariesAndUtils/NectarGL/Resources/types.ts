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
    exportName?: string;
};
type InstanceData = {
    signature: string;
    exportName?: string;
};
type GlobalData = {
    signature: string;
    exportName?: string;
};
type StaticTextureData = {
    signature: string;
    exportName?: string;
};
type ProgramData = {
    vertexSignature: string;
    instanceSignature?: string;
    globalSignatures: {
        [key:string]: string;
    };
    textures: {
        [key: string]: {
            filter: "nearest" | "linear";
            wrap: "repeat" | "clamp";
        };
    };
    vertexShader: string;
    fragmentShader: string;
    exportName?: string;
};
type DrawOperation = {
    program: string;
    vertex: string;
    instance?: string;
    globals: {
        [key: string]: string;
    };
    textures: {
        [key: string]: string | { id: string, latency: number };
    };
};
type DynamicTextureData = {
    screen? : boolean;
    signature: string;
    drawOps: DrawOperation[];
    exportName?: string;
    historyLength?: number;
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