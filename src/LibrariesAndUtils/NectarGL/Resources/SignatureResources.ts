import { PersistentResource } from "./BaseResources";
import type { GlobalSignatureData, InstanceSignatureData, TextureSignatureData, VertexSignatureData } from "./types";

export class VertexSignature extends PersistentResource {
    type = "VertexSignature";
    declare data: VertexSignatureData;
    dispose() {}
};
export class InstanceSignature extends PersistentResource {
    type = "InstanceSignature";
    declare data: InstanceSignatureData;
    dispose() {}
};
export class GlobalSignature extends PersistentResource {
    type = "GlobalSignature";
    declare data: GlobalSignatureData;
    dispose() {}
};
export class TextureSignature extends PersistentResource {
    type = "TextureSignature";
    declare data: TextureSignatureData;
    dispose() {}
};