import parse from "./parse";
import altParse from './altParse';
import { ResourceDict, ResourceType  } from "./Resources";
import Graphics from "./Graphics";


type UnprocessedResource = {
    id: string;
    type: string;
    data: any;
};

function getResourceType(typeStr: string, data: any): ResourceType {
    if (typeStr === "Texture") {
        if ("drawOps" in data) {
            return ResourceType.DynamicTexture;
        } else {
            return ResourceType.StaticTexture;
        }
    }
    return typeStr as ResourceType;
}

function processResources(resources: Map<string,any>, unprocessedResources: UnprocessedResource[], gl: WebGL2RenderingContext) {
    for (const unprocessedResource of unprocessedResources) {
        const type = getResourceType(unprocessedResource.type, unprocessedResource.data);
        const resource = new ResourceDict[type](resources, 
            unprocessedResource.id, 
            unprocessedResource.data,
            gl
        );
        resources.set(unprocessedResource.id, resource);
    }
    for (const resource of resources.values()) {
        if (resource.resourceType === "variable") {
            if ("computeDependencies" in resource) {
                resource.computeDependencies(resources);
            } else throw new Error(`Resource ${resource.id} is missing computeDependencies method`);
        }
    }
    for (const unprocessedResource of unprocessedResources) {
        const resource = resources.get(unprocessedResource.id);
        if (!resource) throw new Error(`Resource ${unprocessedResource.id} not found`);
        if ("markDirtyAndPropogate" in resource) {
            resource.markDirtyAndPropagate();
        }
    };
    return resources;
}

function getResourceChanges(newResources: UnprocessedResource[], oldResources: UnprocessedResource[]) {
    const newResourceMap = new Map(newResources.map(res => [res.id, res]));
    const oldResourceMap = new Map(oldResources.map(res => [res.id, res]));

    const toDelete: UnprocessedResource[] = [];
    const toAdd: UnprocessedResource[] = [];
    // iterate over all keys in new resource map
    for (const key of newResourceMap.keys()) {
        const newContent = JSON.stringify(newResourceMap.get(key));
        if (oldResourceMap.has(key)) {
            const oldContent = JSON.stringify(oldResourceMap.get(key));
            if (oldContent !== newContent) {
                toAdd.push(newResourceMap.get(key));
                toDelete.push(oldResourceMap.get(key));
            }
        } else {
            toAdd.push(newResourceMap.get(key));
        }
    }
    for (const key of oldResourceMap.keys()) {
        if (!newResourceMap.has(key)) {
            toDelete.push(oldResourceMap.get(key));
        }
    }

    return { toDelete, toAdd };
}

export { getResourceChanges, processResources }


// function compile(current: any[], gl: WebGL2RenderingContext) {
//     //const unprocessedResources = typeof script === "string"  ? altParse(script) : script;
//     const resources = processResources(current, gl);
//     return new Graphics(resources, gl);
// };

// export default compile;