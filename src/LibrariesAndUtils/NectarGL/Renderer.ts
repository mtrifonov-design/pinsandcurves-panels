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

    private state: RenderStateObject = {};
    setState(sourceId: string, state: RenderStateObject) {
        if (!this.gfx) return;
        //console.log(sourceId,state);
        if (sourceId !== this.sourceId) return;
        for (const key in state) {
            const versionId = state[key].versionId;
            const existing = this.state[key];
            if (existing && existing.versionId === versionId) {
                continue;
            } else {
                this.gfx.executeCommands(state[key].commands);
            }
        }
        this.state = state;
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
}
export default NectarRenderer;