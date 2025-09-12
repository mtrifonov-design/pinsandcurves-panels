import Graphics from "./Graphics";
import { DynamicTexture } from "./Resources";

type RenderStateObject = {
    [key: string]: {
        versionId: string,
        commands: {
            resource: string,
            type: string,
            payload: any
        }[],
    };
};

class NectarRenderer {

    private gl: WebGL2RenderingContext;
    private gfx : Graphics;
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.gfx = new Graphics(gl);
    }


    private sourceId: string | undefined;
    setSource(sourceId: string, source: any) {
        if (sourceId !== this.sourceId) {
            //console.log("source",source)
            this.gfx.compile(source);
            this.state = {};
            this.sourceId = sourceId;
        }
    };

    private assets = new Map<string, any>();
    attachAssets(assets: [string, any][]) {
        assets.forEach(([id, asset]) => {
            this.assets.set(id, asset);
        });
    }

    private state: RenderStateObject = {};
    setState(sourceId: string, state: RenderStateObject) {
        if (!this.gfx) return;
        //console.log(sourceId,state);
        if (sourceId !== this.sourceId) return;
        const skippedKeys: string[] = [];
        for (const key in state) {
            const versionId = state[key].versionId;
            const existing = this.state[key];
            if (existing && existing.versionId === versionId) {
                continue;
            } else {
                // find asset dependencies in commands:
                const textureDataWrites = state[key].commands.filter(c => c.type === "setTextureData" && typeof c.payload[0] === "string" && c.payload[0].startsWith("asset://"));
                const textureAssets = textureDataWrites.map(c => c.payload[0].replace("asset://", ""));
                // check if all assets are available
                const allAssetsAvailable = textureAssets.every(asset => this.assets.has(asset));
                if (!allAssetsAvailable) {
                    skippedKeys.push(key);
                    continue;
                }
                //console.log(state[key].commands)
                this.gfx.executeCommands(state[key].commands, this.assets);
            }
        }
        const filteredState = Object.fromEntries(
            Object.entries(state).filter(([key]) => !skippedKeys.includes(key))
        );
        this.state = filteredState;
    };

    frame() {
        if (!this.gfx) return;
        //console.log(this.state)
        const screenTexture = Array.from(this.gfx.resources.values()).find(t => t.data.screen === true) as DynamicTexture;
        //console.log(screenTexture)
        if (screenTexture) {
            screenTexture.updateTextureData();
        }
    };

    captureTexture(id: string) {
        if (!this.gfx) return undefined;
        const resource = Array.from(this.gfx.resources.values()).find(r => r.data.exportName === id);
        if (resource && resource.type === "DynamicTexture") {
            return resource.updateTextureData(true);
        }
        return undefined;
    }
}
export default NectarRenderer;