import type { ResourceClass } from ".";

abstract class PersistentResource {
    resourceType = "persistent";
    abstract type: string;
    id : string;
    data: unknown;

    protected gl: WebGL2RenderingContext;
    protected resources: Map<string, VariableResource | PersistentResource>;
    constructor(resources: Map<string, VariableResource | PersistentResource>, id: string, data: unknown, gl: WebGL2RenderingContext) {
        this.id = id;
        this.data = data;
        this.resources = resources;
        this.gl = gl;
    }
}

abstract class VariableResource {
    resourceType = "variable";
    abstract type: string;
    id: string;
    data: unknown;
    protected resources: Map<string, ResourceClass>;
    dirty = true;
    dependsOn: string[] = [];
    isDependencyOf: string[] = [];
    protected gl: WebGL2RenderingContext;
    constructor(resources: Map<string, ResourceClass>, id: string, data: unknown, gl: WebGL2RenderingContext) {
        this.id = id;
        this.data = data;
        this.resources = resources;
        this.gl = gl;
    }
    markAndPropagateDirty() {
        this.dirty = true;
        //console.log(this.id,this.isDependencyOf)
        for (const dep of this.isDependencyOf) {
            const resource = this.resources.get(dep);
            if (resource && "markAndPropagateDirty" in resource) {
                //console.log("marking dirty", resource.id);  
                resource.markAndPropagateDirty();
            }
        }
    }
}

export { VariableResource, PersistentResource };
