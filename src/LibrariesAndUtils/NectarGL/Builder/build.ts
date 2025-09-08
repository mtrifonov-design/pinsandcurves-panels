function deepBind(resources: any[], bindings: { [key: string]: string }) {
    function deepBindRecursive(resource: any): any {
        if (typeof resource === "string" && resource.startsWith("@_?")) {
            //console.log(resource.substring(3));
            //console.log(bindings);
            return bindings[resource.substring(3)] || resource;
        }
        if (Array.isArray(resource)) {
            return resource.map(deepBindRecursive);
        }
        if (typeof resource === "object" && resource !== null) {
            const newObj: any = {};
            for (const key in resource) {
                newObj[key] = deepBindRecursive(resource[key]);
            }
            return newObj;
        }
        return resource;
    }
    return deepBindRecursive(resources);
}

function deepReplace(resources: any[], prefix: string) {
    function deepReplaceRecursive(resource: any): any {
        if (typeof resource === "string" && resource.startsWith("@_")) {
            return resource.replace("@_", `${prefix}_`);
        }
        if (Array.isArray(resource)) {
            return resource.map(deepReplaceRecursive);
        }
        if (typeof resource === "object" && resource !== null) {
            const newObj: any = {};
            for (const key in resource) {
                newObj[key] = deepReplaceRecursive(resource[key]);
            }
            return newObj;
        }
        return resource;
    }
    return deepReplaceRecursive(resources);
}

function build(
    resourceObjectCallback: (r: (s: string) => string) => {
        [key: string]: {
            type: "string",
            data: any,
        } | Function<any>
    }
) {
    return (self: string) => {
        const ref = (id: string) => `${self}_${id}`;
        let resourceEntries = Object.entries(resourceObjectCallback(ref));
        const expandedResources = [];
        const indicesToDelete : number[] = [];
        for (let i= 0; i< resourceEntries.length; i++) {
            const [id, obj] = resourceEntries[i];
            if (typeof obj === "function") {
                const newResources = obj(`${self}_${id}`);
                expandedResources.push(...newResources);
                indicesToDelete.push(i);
            }
        }

        for (let i= 0; i< resourceEntries.length; i++) {
            const [id, obj] = resourceEntries[i];
            if (typeof obj !== "function" && obj.type === "Use") {
                let data = deepBind(obj.data.resources, obj.data.bindings);
                data = deepReplace(data, `${self}_${id}`);
                expandedResources.push(...data);
                indicesToDelete.push(i);
            }
        };


        resourceEntries = resourceEntries.filter((_,i) => !indicesToDelete.includes(i));
        // resourceEntries.push(...expandedResources);

        // console.log(resourceEntries)
    
        const resources = resourceEntries.map(([id, obj]) => {
            return {
                id: `${self}_${id}`,
                ...obj
            };
        });
        resources.push(...expandedResources)
        return resources;
    }
};

export default build;