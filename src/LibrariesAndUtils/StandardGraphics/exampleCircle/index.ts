import { build, external, Global, GlobalSignature, Program, Texture } from "../../NectarGL/Builder";
import putTexture from "../putTexture";
import blurX from './blurX_fs.glsl';
import blurY from './blurY_fs.glsl';

function ExampleCircle({
    quad,
    quadSig,
    canvasSig,
    compositionGlobal,
    compositionGlobalSig,
    inputTexture,
    exportName,
    signals,
    signalsSig
}: {
    quad: string,
    quadSig: string,
    canvasSig: string,
    compositionGlobal: string,
    compositionGlobalSig: string,
    inputTexture: string,
    exportName: string,
    signals: string,
    signalsSig: string,
}) {
    return build(ref => {
        return {
            p_circle : Program({
                vertexSignature: quadSig,
                globalSignatures: {
                    c: compositionGlobalSig,
                    s: signalsSig,
                },
                vertexShader: `
                out vec2 uv;
                void main() {

                    // correct uv for aspect ratio
                    uv = position / 2. + vec2(0.5);
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
                `,
                fragmentShader: `
                in vec2 uv;
                void main() {
                    float w = canvas.x;
                    float h = canvas.y;
                    float aspect = w / h;
                    float x = (posX / 100.) + 0.5;
                    float y = (posY / 100.);
                    float r = length(uv * vec2(aspect, 1.0) - vec2(x, y));
                    float tR = radius / 100.;
                    float alpha = smoothstep(tR, tR - 0.02, r);
                    vec4 srcPx = texture(src, uv);
                    //outColor = mix(srcPx, vec4(bubble, 1.0), alpha);
                    //outColor = srcPx + vec4(1.0, 1.0, 1.0, alpha);

                    float angle = atan(uv.y - y, (uv.x * aspect) - x);
                    float dist = r / tR;  // normalized distance from center

                    // Base bubble tint (blueish)
                    vec3 base = mix(vec3(0.8, 0.9, 1.0), vec3(0.2, 0.6, 1.0), dist);

                    // Add iridescence: shift color with angle
                    vec3 iridescence = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + angle * 5.0);

                    // Mix base with iridescence
                    vec3 bubble = mix(base, iridescence, 0.3);

                    // Fake light direction (top-left)
                    vec2 lightDir = normalize(vec2(-0.7, 0.5));
                    float highlight = dot(normalize(vec2((uv.x*aspect - x), (uv.y - y))), lightDir);
                    highlight = pow(max(highlight, 0.0), 20.0);

                    // Combine everything
                    bubble += highlight * 0.8;  // specular
                    bubble = clamp(bubble, 0.0, 1.0);

                    outColor = mix(srcPx, vec4(bubble, 1.0), alpha);
                }
                `,
                textures: {
                    src: {
                        filter: "linear",
                        wrap: "clamp",
                    }
                },
            }),
            out: Texture({
                signature: canvasSig,
                drawOps: [
                    {
                        program: ref("p_circle"),
                        vertex: quad,
                        globals: {
                            c: compositionGlobal,
                            s: signals,
                        },
                        textures: {
                            src: inputTexture
                        }
                    },
                ],
            }),
        }
    })
}

export default ExampleCircle;