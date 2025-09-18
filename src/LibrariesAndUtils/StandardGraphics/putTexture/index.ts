import { Program } from "../../NectarGL/Builder";

export default (quadSig: string) => Program({
    vertexSignature: quadSig,
    globalSignatures: {
    },
    vertexShader: `
    out vec2 uv;
    void main() {
        uv = position / 2. + vec2(0.5);
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
    `,
    fragmentShader: `
    in vec2 uv;
    void main() {
        outColor = texture(src, uv);
    }
    `,
    textures: {
        src: {
            filter: "linear",
            wrap: "clamp",
        }
    },
})