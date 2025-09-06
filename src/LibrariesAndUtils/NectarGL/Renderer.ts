import compile from "./compile";
import Graphics from "./Graphics";

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
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    private gfx : Graphics | undefined;
    private sourceId: string | undefined;
    setSource(sourceId: string, source: any) {
        this.sourceId = sourceId;
        if (!this.gfx) {
            this.gfx = compile(source, this.gl);
        } else {
            this.gfx.dispose();
            this.state = {};
            this.gfx = compile(source, this.gl);
        }
    };

    private state: RenderStateObject = {};
    setState(sourceId: string, state: RenderStateObject) {
        if (!this.gfx) return;
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
        this.gfx.refreshScreen();
    };
}
export default NectarRenderer;