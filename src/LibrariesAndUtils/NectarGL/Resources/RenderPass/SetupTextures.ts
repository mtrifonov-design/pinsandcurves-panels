import type { DynamicTexture, ResourceClass, StaticTexture } from "..";
import type { ProgramData } from "../types";

export default function SetupTextures(
    gl: WebGL2RenderingContext,
    resources: Map<string, ResourceClass>,
    textures: { [key: string]: string },
    programData: ProgramData,
    program: WebGLProgram) {

        let slot = 0;
        for (const [textureName, textureId] of Object.entries(textures)) {
            SetupTexture(gl, resources, textureName, textureId, programData, program, slot);
            slot++;
        }

};


function SetupTexture(
    gl: WebGL2RenderingContext,
    resources: Map<string, ResourceClass>,
    textureName: string,
    textureId: string,
    programData: ProgramData,
    program: WebGLProgram,
    slot: number
) {
    //console.log("Setting up textures", textureName, textureId);
    const texture = resources.get(textureId) as undefined | DynamicTexture | StaticTexture; 
    if (!texture) throw new Error("Something went wrong.");
    if (texture.type !== "StaticTexture" && texture.type !== "DynamicTexture") throw new Error("Something went wrong.");

    
    const location = gl.getUniformLocation(program, textureName);
    if (location === null) throw new Error("Something went wrong.");
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, texture.textureProvider.texture);
    const texSettings = programData.textures[textureName];
    if (!texSettings) throw new Error("Something went wrong.");
    const filter = texSettings.filter === "linear" ? gl.LINEAR : gl.NEAREST;
    const wrap = texSettings.wrap === "repeat" ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    // set filter and wrap
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);

    gl.uniform1i(location, slot);

}