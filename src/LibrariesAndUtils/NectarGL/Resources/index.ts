import { Program } from "./Program";
import { TextureSignature, VertexSignature, InstanceSignature, GlobalSignature } from "./SignatureResources";
import { StaticTexture, DynamicTexture } from "./Texture";
import { Vertex } from "./Vertex";
import { Instance } from "./Instance";
import { Global } from "./Global";

export { 
    Program, 
    TextureSignature, 
    VertexSignature,
    InstanceSignature, 
    GlobalSignature, 
    StaticTexture, 
    DynamicTexture,
    Global,
    Vertex,
    Instance
};

enum ResourceType {
    VertexSignature = "VertexSignature",
    InstanceSignature = "InstanceSignature",
    GlobalSignature = "GlobalSignature",
    StaticTexture = "StaticTexture",
    DynamicTexture = "DynamicTexture",
    Global = "Global",
    Vertex = "Vertex",
    Instance = "Instance",
    TextureSignature = "TextureSignature",
    Program = "Program"
}

const ResourceDict = {
    [ResourceType.VertexSignature]: VertexSignature,
    [ResourceType.InstanceSignature]: InstanceSignature,
    [ResourceType.GlobalSignature]: GlobalSignature,
    [ResourceType.TextureSignature]: TextureSignature,
    [ResourceType.StaticTexture]: StaticTexture,
    [ResourceType.DynamicTexture]: DynamicTexture,
    [ResourceType.Global]: Global,
    [ResourceType.Vertex]: Vertex,
    [ResourceType.Instance]: Instance,
    [ResourceType.Program]: Program
}

type ResourceClass =
    | VertexSignature
    | InstanceSignature
    | GlobalSignature
    | TextureSignature
    | StaticTexture
    | DynamicTexture
    | Global
    | Vertex
    | Instance
    | Program;

export { ResourceType };
export { ResourceDict };
export type { ResourceClass };