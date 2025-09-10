import { SourceRegistry } from "./types";

function getSourceId(instanceId: string, sourceId: string, sourceRegistry: SourceRegistry): string {
    const foundSourceId = sourceRegistry.instances[instanceId];
    if (foundSourceId === sourceId) {
        return sourceRegistry.currentSourceId;
    }
    return "INVALIDATED";
}
export default getSourceId;