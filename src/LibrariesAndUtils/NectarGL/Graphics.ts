import { ResourceType } from "./Resources";
import type { DynamicTexture, ResourceClass, StaticTexture } from "./Resources";

export default class Graphics {
    resources: Map<string, typeof ResourceClass>;
    private gl: WebGL2RenderingContext;
    constructor(resources: Map<string, typeof ResourceClass>, gl: WebGL2RenderingContext) {
        this.resources = resources;
        this.gl = gl;
    }

    setScreen(resourceName: string) {
        const gl = this.gl;

        // ---- lazy init program (once) ----
        if (!this._blit) {
            const vs = `#version 300 es
    // Fullscreen triangle via gl_VertexID (0,1,2)
    out vec2 v_uv;
    void main() {
      // positions covering the screen
      // (-1,-1), (3,-1), (-1,3) -> one big triangle
      vec2 pos = vec2(
        (gl_VertexID == 1) ?  3.0 : -1.0,
        (gl_VertexID == 2) ?  3.0 : -1.0
      );
      // Map pos from clip-space to UV [0,1]
      v_uv = 0.5 * pos + 0.5;
      gl_Position = vec4(pos, 0.0, 1.0);
    }`;

            const fs = `#version 300 es
    precision mediump float;
    in vec2 v_uv;
    uniform sampler2D u_tex;
    out vec4 outColor;
    void main() {
      outColor = texture(u_tex, v_uv);
      //outColor = vec4(1.0,0.,0.,1.);
    }`;

            const compile = (type: number, src: string) => {
                const s = gl.createShader(type)!;
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    throw new Error(gl.getShaderInfoLog(s) || "Shader compile failed");
                }
                return s;
            };

            const prog = gl.createProgram()!;
            gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
            gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(prog) || "Program link failed");
            }

            const uTex = gl.getUniformLocation(prog, "u_tex")!;
            this._blit = { prog, uTex, resourceName };
        }


    }

    refreshScreen() {
        // ---- fetch texture ----
        const texObj = this.resources.get(this._blit.resourceName);
        const gl = this.gl;
        if (!texObj || !texObj.textureProvider?.texture) {
            throw new Error("Missing texture resource");
        }
        const texture: WebGLTexture = texObj.textureProvider.texture;

        // ---- draw to default framebuffer ----
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.disable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this._blit.prog);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);


        // Optional but safe defaults (ensure you set these at texture creation/upload time):
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(this._blit.uTex, 0);

        // No VAO/VBO needed; gl_VertexID drives the triangle.
        gl.drawArrays(gl.TRIANGLES, 0, 3);

    }

}