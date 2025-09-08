import build from "./build";
import Use from "./use";
const external = (s: string) => `@_?${s}`;
export { external };
export { Use };
export { build };
import exportResources from "./export";
export { exportResources };

import { VertexSignature,
    InstanceSignature,
    GlobalSignature,
    TextureSignature,
    Program,
    Vertex,
    Instance,
    Global,
    Texture,
 } from "./ResourceBuilders";
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

}