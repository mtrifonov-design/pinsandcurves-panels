import { GlobalData, 
    GlobalSignatureData, 
    InstanceData, 
    InstanceSignatureData, 
    ProgramData, 
    TextureSignatureData, 
    VertexData, 
    VertexSignatureData,
    StaticTextureData,
    DynamicTextureData,
    DrawOperation
} from "../../Resources/types";

function VertexSignature(data: VertexSignatureData) { return {
    type: "VertexSignature",
    data,
} };
function GlobalSignature(data: GlobalSignatureData) { return {
    type: "GlobalSignature",
    data,
} };
function InstanceSignature(data: InstanceSignatureData) { return {
    type: "InstanceSignature",
    data,
} };
function TextureSignature(data: TextureSignatureData) { return {
    type: "TextureSignature",
    data,
} };

function Vertex(data: VertexData) { return {
    type: "Vertex",
    data,
} };
function Instance(data: InstanceData) { return {
    type: "Instance",
    data,
} };
function Global(data: GlobalData) { return {
    type: "Global",
    data,
} };
function Texture(data: StaticTextureData | DynamicTextureData) { return {
    type: "Texture",
    data,
} };
function Program(data: ProgramData) { return {
    type: "Program",
    data,
} };
function DrawOp(data: DrawOperation) {
    return data;
};

export {
    VertexSignature,
    GlobalSignature,
    InstanceSignature,
    TextureSignature,
    Vertex,
    Instance,
    Global,
    Texture,
    Program,
    DrawOp
}
