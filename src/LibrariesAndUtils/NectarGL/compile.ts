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

function processResources(unprocessedResources: UnprocessedResource[], gl: WebGL2RenderingContext) {
    const resources = new Map();
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
    return resources;
}

function compile(script: any[], gl: WebGL2RenderingContext) {
    //const unprocessedResources = typeof script === "string"  ? altParse(script) : script;
    const resources = processResources(script,gl);
    return new Graphics(resources, gl);
};

export default compile;