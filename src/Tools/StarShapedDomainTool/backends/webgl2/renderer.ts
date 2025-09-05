import { Engine } from "../../core/Engine";
import Program from "./HelperLib/Program";
import Texture from "./HelperLib/Texture";
import UniformProvider from "./HelperLib/UniformProvider";
import VertexProvider from "./HelperLib/VertexProvider";
import { circleProgram, circleVertexProvider } from "./CircleProgram/circleProgram";
import { mainCanvasProgram } from "./MainCanvasProgram/MainCanvasProgram";
import { scanViewProgram } from "./ScanViewProgram/ScanViewProgram";
import { effectProgram } from "./EffectProgram/EffectProgram";

// @ts-nocheck
export class StarShapedDomainWipeRenderer {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            preserveDrawingBuffer: true,
        });
        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }
        //this.setup();
    }

    async onFrameReady(cb) {
        return cb();
    }

    image: HTMLImageElement;
    imageId: string = '';

    resources : any = {};
    setup(engine: Engine) {
        this.gl.getExtension('EXT_color_buffer_float');
        
        this.resources.uniformProviderSignature = {
            uniformProviderName: 'Uniforms',
            uniformStructure: [
                { name: 'shapePoint', type: 'vec2' },
                { name: 'canvasPoint', type: 'vec2' },
                { name: 'boundingBox', type: 'vec4' }
            ]
        };
        this.resources.mainCanvasUniformProviderSignature = {
            uniformProviderName: 'MainCanvasUniforms',
            uniformStructure: [
                { name: 'canvasBox', type: 'vec4' },
                { name: 'boundingBox', type: 'vec4' },
                { name: 'time', type: 'vec2' },
                { name: 'dimensions', type: 'vec2' },
                { name: 'numberColorStops', type: 'int' },
                { name: 'perspectiveFactor', type: 'float' },
                { name: 'aspectRatio', type: 'float' },
            ]
        };

        this.resources.effectUniformsProviderSignature = {
            uniformProviderName: 'EffectUniforms',
            uniformStructure: [
                { name: 'boundingBox', type: 'vec4' },
                { name: 'dimensions', type: 'vec2' },
                { name: 'aspectRatio', type: 'float' },
                { name: 'grainEnabled', type: 'int'},
                { name: 'grainIntensity', type: 'float' }, 
                { name: 'time', type: 'float' },
            ]
        };
        this.resources.scanViewUniformProviderSignature = {
            uniformProviderName: 'ScanViewUniforms',
            uniformStructure: [
                { name: 'boundingBox', type: 'vec4' },
                { name: 'shapePoint', type: 'vec2' },
            ]
        };
        this.resources.circleVertexProvider = circleVertexProvider(this.gl);
        this.resources.circleProgram = circleProgram(this.gl, this.resources.uniformProviderSignature);
        this.resources.circleProgram.setup();
        this.resources.uniformProvider = new UniformProvider(this.gl, this.resources.uniformProviderSignature);
        this.resources.uniformProvider.setup();
        this.resources.mainCanvasUniformProvider = new UniformProvider(this.gl, this.resources.mainCanvasUniformProviderSignature);
        this.resources.mainCanvasUniformProvider.setup();
        this.resources.scanViewUniformProvider = new UniformProvider(this.gl, this.resources.scanViewUniformProviderSignature);
        this.resources.scanViewUniformProvider.setup();
        this.resources.effectUniformsProvider = new UniformProvider(this.gl, this.resources.effectUniformsProviderSignature);
        this.resources.effectUniformsProvider.setup();
        
        this.resources.fullscreenQuadVertexProviderSignature = {
            vertexProviderName: 'FullscreenQuad',
            vertexStructure: [
                { name: 'a_position', type: 'vec2' },
                { name: 'texCoord', type: 'vec2' }
            ],
            vertexCount: 4,
            indexCount: 6,
            instancedCall: false
        };
        this.resources.fullscreenQuadVertexProvider = new VertexProvider(this.gl, this.resources.fullscreenQuadVertexProviderSignature);
        this.resources.fullscreenQuadVertexProvider.setup();
        this.resources.exampleProgram = new Program(this.gl, {
            vertexShader: `
            out vec2 v_texCoord;
            void main() {
                mat3 m = mat3(
                    boundingBox.x, 0., 0.,
                    0., boundingBox.y, 0.,
                    boundingBox.z, boundingBox.w, 1.
                );
                vec3 pos = m * vec3(a_position, 1.0);

                gl_Position = vec4(pos.xy, 0.0, 1.0);
                v_texCoord = texCoord;
            }
            `,
            fragmentShader: `
            out vec4 outColor;
            in vec2 v_texCoord;
            uniform sampler2D u_texture;
            void main() {
                outColor = vec4(texture(u_texture, v_texCoord).rgba);
                //outColor = vec4(v_texCoord, 0.0, 1.0); // just for testing
            }
            `,
            vertexProviderSignature: this.resources.fullscreenQuadVertexProviderSignature,
            uniformProviderSignature: this.resources.uniformProviderSignature
        });
        this.resources.exampleProgram.setup();
        this.resources.inputShape = new Texture(this.gl, {
            shape: [500, 500],
            type: 'RGBA8',
            textureOptions: {
                minFilter: this.gl.LINEAR,
                magFilter: this.gl.LINEAR,
                wrapS: this.gl.CLAMP_TO_EDGE,
                wrapT: this.gl.CLAMP_TO_EDGE
            },
        })
        this.resources.inputShape.setup();
        //console.log('Setting input shape texture data', engine.image);
        this.resources.inputShape.setData(engine.image);
        this.imageId = engine.currentImageAssetId;

        this.resources.shapeViewerTexture = new Texture(this.gl, {
            shape: [500, 500],
            type: 'RGBA8',
            createFramebuffer: true,
        });
        this.resources.shapeViewerTexture.setup();

        this.resources.mainCanvasTexture = new Texture(this.gl, {
            shape: [1920,1080],
            type: 'RGBA8',
            createFramebuffer: true,
        })
        this.resources.mainCanvasTexture.setup();
        this.resources.fullscreenQuadVertexProvider.setVertexData({
            a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0],
            texCoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]
        })
        this.resources.fullscreenQuadVertexProvider.setIndexData([0, 1, 2, 1, 3, 2]);

        this.resources.distanceTexture = new Texture(this.gl, {
            shape: [4000,1],
            type: 'R8',
            createFramebuffer: true,
            textureOptions: {
                minFilter: this.gl.LINEAR,
                magFilter: this.gl.LINEAR,
                wrapS: this.gl.REPEAT,
                wrapT: this.gl.CLAMP_TO_EDGE
            }
        });
        this.resources.distanceTexture.setup();
        this.resources.distanceComputationProgram = new Program(this.gl, {
            vertexShader: `
            out vec2 v_texCoord;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = texCoord;
            }
        `,
            fragmentShader: `
            out float distanceValue;
            in vec2 v_texCoord;
            uniform sampler2D u_texture;
            vec2 toUV(vec2 p) {
                return p * 0.5 + 0.5;
            }

            float threshold(float val) {
                if (val > 0.5) {
                    return 1.0;
                } else {
                    return 0.0;
                }
            }
            void main() {
                float angle = v_texCoord.x * 6.28318530718; 
                vec2 p1 = shapePoint;
                float val = texture(u_texture, toUV(p1)).a;
                float inShapeVal = threshold(val);
                vec2 p2 = vec2(0.);
                for (int i = 1; i < 11; i++) {
                    float pc = float(i) / 10.0;
                    p2 = shapePoint + vec2(cos(angle), sin(angle)) * pc * sqrt(8.0);
                    float val = texture(u_texture, toUV(p2)).a;
                    bool notInShape = threshold(val) != inShapeVal;
                    if (notInShape) {
                        break;
                    }
                }
                vec2 mid = (p1 + p2) * 0.5;
                for (int i = 0; i < 16; i++) {
                    float val = texture(u_texture, toUV(mid)).a;
                    if (val > 0.5) {
                        val = 1.0;
                    } else {
                        val = 0.0;
                    }
                    bool inShape = val == inShapeVal;
                    if (inShape) {
                        p1 = mid;
                    } else {
                        p2 = mid;
                    }
                    mid = (p1 + p2) * 0.5;
                }
                distanceValue = sqrt(dot(mid - shapePoint, mid - shapePoint)) / sqrt(8.0);
                //distanceValue = 0.5;
            }
        `,
            vertexProviderSignature: this.resources.fullscreenQuadVertexProviderSignature,
            uniformProviderSignature: this.resources.uniformProviderSignature
        });
        this.resources.distanceComputationProgram.setup();

        this.resources.mainCanvasDistanceRendererProgram = mainCanvasProgram(
            this.gl,
            this.resources.mainCanvasUniformProviderSignature,
            this.resources.fullscreenQuadVertexProviderSignature
        )
        this.resources.mainCanvasDistanceRendererProgram.setup();
        this.resources.scanViewProgram = scanViewProgram(
            this.gl,
            this.resources.scanViewUniformProviderSignature,
            this.resources.fullscreenQuadVertexProviderSignature
        )
        this.resources.scanViewProgram.setup();

        this.resources.effectProgram = effectProgram(
            this.gl,
            this.resources.effectUniformsProviderSignature,
            this.resources.fullscreenQuadVertexProviderSignature
        );
        this.resources.effectProgram.setup();

        this.resources.colorGradientTexture = new Texture(this.gl, {
            shape: [200,1],
            type: 'RGBA32F',
            createFramebuffer: false,
            textureOptions: {
                minFilter: this.gl.NEAREST,
                magFilter: this.gl.NEAREST,
                wrapS: this.gl.CLAMP_TO_EDGE,
                wrapT: this.gl.CLAMP_TO_EDGE
            }
        });
        this.resources.colorGradientTexture.setup();
    }


    width = 1920;
    height = 1080;

    draw(engine: Engine) {
        if (engine.CONFIG.width !== this.width || engine.CONFIG.height !== this.height) {
            this.width = engine.CONFIG.width;
            this.height = engine.CONFIG.height;
            this.resources.mainCanvasTexture.setDescription({
                shape: [engine.CONFIG.width, engine.CONFIG.height],
                type: 'RGBA8',
                createFramebuffer: true
            });
        }

        if ((this.imageId !== engine.currentImageAssetId)) {
            this.resources.inputShape.setData(engine.image);
            this.imageId = engine.currentImageAssetId;
        }

        const colorFloatArray = new Float32Array(200 * 4);
        for (let i = 0; i < 200; i++) {
            colorFloatArray[i] = 1.0;
        }
        const sortedColorStops = engine.CONFIG.colorStops.sort((a, b) => a.position - b.position);
        const firstColorStop = sortedColorStops[0];
        colorFloatArray[0] = firstColorStop.color.r;
        colorFloatArray[1] = firstColorStop.color.g;
        colorFloatArray[2] = firstColorStop.color.b;
        colorFloatArray[3] = 0;
        for (let i = 0; i < sortedColorStops.length; i++) {
            const colorStop = sortedColorStops[i];
            const index = (i + 1) * 4;
            colorFloatArray[index] = colorStop.color.r;
            colorFloatArray[index + 1] = colorStop.color.g;
            colorFloatArray[index + 2] = colorStop.color.b;
            colorFloatArray[index + 3] = colorStop.position;
        }
        // add the first color stop at the end to create a loop
        const lastIndex = (sortedColorStops.length + 1) * 4;
        colorFloatArray[lastIndex] = firstColorStop.color.r;
        colorFloatArray[lastIndex + 1] = firstColorStop.color.g;
        colorFloatArray[lastIndex + 2] = firstColorStop.color.b;
        colorFloatArray[lastIndex + 3] = 1;
        this.resources.colorGradientTexture.setData(colorFloatArray);

        // Render Pass: Compute distances
        this.gl.viewport(0, 0, 4000, 1);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.resources.distanceTexture.framebuffer);
        //this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.resources.uniformProvider.setUniforms({
            shapePoint: engine.CONFIG.shapePoint,
            canvasPoint: engine.CONFIG.canvasPoint,
            boundingBox: [1, 1, 0, 0] // full canvas
        });
        this.resources.distanceComputationProgram.draw({
            uniformProvider: this.resources.uniformProvider,
            vertexProvider: this.resources.fullscreenQuadVertexProvider,
            textures: {
                u_texture: this.resources.inputShape
            }
        });


        // Render Pass 1: Render into main canvas texture
        this.gl.viewport(0, 0, engine.CONFIG.width, engine.CONFIG.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.resources.mainCanvasTexture.framebuffer);
        this.gl.clearColor(1, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.blendEquation(this.gl.FUNC_ADD);
        
        this.resources.mainCanvasUniformProvider.setUniforms({
            canvasBox: [...engine.CONFIG.canvasPoint, engine.CONFIG.canvasScale,engine.CONFIG.shapeScale],
            boundingBox: [1, 1, 0, 0],
            time: [engine.REL_TIME,0],
            numberColorStops: engine.CONFIG.colorStops.length + 1,
            perspectiveFactor: engine.CONFIG.perspectiveFactor,
            aspectRatio: engine.CONFIG.height / engine.CONFIG.width,
            dimensions: [engine.CONFIG.width, engine.CONFIG.height],
        });
        
        this.resources.mainCanvasDistanceRendererProgram.draw({
            uniformProvider: this.resources.mainCanvasUniformProvider,
            vertexProvider: this.resources.fullscreenQuadVertexProvider,
            textures: {
                u_texture: this.resources.distanceTexture,
                u_colorGradient: this.resources.colorGradientTexture
            }
        });


        // - shape point [1,1,... - shape point]
        // scale  [scale, scale, 0, 0]
        // + shape point [1,1,... + shape point]
        const scale = engine.CONFIG.shapeScale;
        const sx = -scale;
        const sy = -scale * engine.CONFIG.width / engine.CONFIG.height;
        const shapePos = [engine.CONFIG.shapePoint[0], engine.CONFIG.shapePoint[1]];
        const cp = engine.CONFIG.canvasPoint;
        const tx = -sx* (shapePos[0]) + cp[0];
        const ty = -sy * (shapePos[1]) + cp[1] * (engine.CONFIG.width / engine.CONFIG.height);

        if (engine.CONFIG.overlayShape) {
            this.resources.uniformProvider.setUniforms({
                shapePoint: engine.CONFIG.shapePoint,
                canvasPoint: engine.CONFIG.canvasPoint,
                boundingBox: [sx, sy,  tx, ty] // full canvas
            });

            this.resources.exampleProgram.draw({
                uniformProvider: this.resources.uniformProvider,
                vertexProvider: this.resources.fullscreenQuadVertexProvider,
                textures: {
                    u_texture: this.resources.inputShape
                }
            });
        }
        this.gl.disable(this.gl.BLEND); // disable blending for the next pass




        // Render Pass 2: Render into shape viewer texture
        this.gl.viewport(0, 0, 500, 500);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.resources.shapeViewerTexture.framebuffer);
        this.gl.clearColor(1, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        // enable regular alpha blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.blendEquation(this.gl.FUNC_ADD);
        this.resources.uniformProvider.setUniforms({
            shapePoint: engine.CONFIG.shapePoint,
            canvasPoint: engine.CONFIG.canvasPoint,
            boundingBox: [1, 1, 0, 0] 
        });

        this.resources.exampleProgram.draw({
            uniformProvider: this.resources.uniformProvider,
            vertexProvider: this.resources.fullscreenQuadVertexProvider,
            textures: {
                u_texture: this.resources.inputShape
            }
        });
        this.resources.scanViewUniformProvider.setUniforms({
            shapePoint: engine.CONFIG.shapePoint,
            boundingBox: [-1,1, 0, 0] 
        });
        this.resources.scanViewProgram.draw({
                uniformProvider: this.resources.scanViewUniformProvider,
                vertexProvider: this.resources.fullscreenQuadVertexProvider,
                textures: {
                    u_texture: this.resources.distanceTexture
                }
        });
        this.resources.uniformProvider.setUniforms({
                shapePoint: engine.CONFIG.shapePoint,
                canvasPoint: engine.CONFIG.canvasPoint,
                boundingBox: [1, 1, 0, 0] // full canvas
        });
        this.resources.circleProgram.draw({
            uniformProvider: this.resources.uniformProvider,
            vertexProvider: this.resources.circleVertexProvider,
            textures: {
            }
        })
        this.gl.disable(this.gl.BLEND); // disable blending for the next pass

        // Render Pass 3, composite the final image
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.resources.effectUniformsProvider.setUniforms({
            boundingBox: [-1,1, 0, 0],
            aspectRatio: engine.CONFIG.height / engine.CONFIG.width,
            dimensions: [engine.CONFIG.width, engine.CONFIG.height],
            grainEnabled: engine.CONFIG.grainEnabled ? 1 : 0,
            grainIntensity: engine.CONFIG.grainIntensity,
            time: engine.REL_TIME,
        });
        this.resources.effectProgram.draw({
            uniformProvider: this.resources.effectUniformsProvider,
            vertexProvider: this.resources.fullscreenQuadVertexProvider,
            textures: {
                u_texture: this.resources.mainCanvasTexture
            }
        });
        
        if (engine.CONFIG.showShapeInspector) {
            this.resources.uniformProvider.setUniforms({
                shapePoint: engine.CONFIG.shapePoint,
                canvasPoint: engine.CONFIG.canvasPoint,
                boundingBox: [0.25, -0.25 * engine.CONFIG.width / engine.CONFIG.height, 0.5, -0.5 ] 
            });
            this.resources.exampleProgram.draw({
                uniformProvider: this.resources.uniformProvider,
                vertexProvider: this.resources.fullscreenQuadVertexProvider,
                textures: {
                    u_texture: this.resources.shapeViewerTexture
                }
            });

        }

    };

}
