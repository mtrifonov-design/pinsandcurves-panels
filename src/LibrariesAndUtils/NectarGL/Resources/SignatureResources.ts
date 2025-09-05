import { PersistentResource } from "./BaseResources";
import type { GlobalSignatureData, InstanceSignatureData, TextureSignatureData, VertexSignatureData } from "./types";

export class VertexSignature extends PersistentResource {
    type = "VertexSignature";
    declare data: VertexSignatureData;
};
export class InstanceSignature extends PersistentResource {
    type = "InstanceSignature";
    declare data: InstanceSignatureData;
};
export class GlobalSignature extends PersistentResource {
    type = "GlobalSignature";
    declare data: GlobalSignatureData;
};
export class TextureSignature extends PersistentResource {
    type = "TextureSignature";
    declare data: TextureSignatureData;
};