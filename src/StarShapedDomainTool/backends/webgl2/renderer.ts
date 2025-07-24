import Program from "./HelperLib/Program";
import Texture from "./HelperLib/Texture";
import UniformProvider from "./HelperLib/UniformProvider";
import VertexProvider from "./HelperLib/VertexProvider";

// @ts-nocheck
export class StarShapedDomainWipeRenderer {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }
        //this.setup();
    }

    image: HTMLImageElement;
    async init() {
        const imAdr = "/pinsandcurves-panels/shape.jpg";
        const image = new Image();
        image.src = imAdr;
        this.image = image;
        await new Promise((resolve) => {
            image.onload = () => {
                resolve(true);
            };
        });
    }

    resources : any = {};
    setup() {
        this.gl.getExtension('EXT_color_buffer_float');
        this.resources.uniformProviderSignature = {
            uniformProviderName: 'Uniforms',
            uniformStructure: [
                { name: 'shapePoint', type: 'vec2' },
                { name: 'canvasPoint', type: 'vec2' },
                { name: 'boundingBox', type: 'vec4' }
            ]
        };
        this.resources.uniformProvider = new UniformProvider(this.gl, this.resources.uniformProviderSignature);
        this.resources.uniformProvider.setup();
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
                outColor = vec4(texture(u_texture, v_texCoord).rgb, 1.0);
                //outColor = vec4(v_texCoord, 0.0, 1.0); // just for testing
            }
            `,
            vertexProviderSignature: this.resources.fullscreenQuadVertexProviderSignature,
            uniformProviderSignature: this.resources.uniformProviderSignature
        });
        this.resources.exampleProgram.setup();
        this.resources.inputShape = new Texture(this.gl, {
            shape: [this.image.width, this.image.height],
            type: 'RGBA8',
        })
        this.resources.inputShape.setup();
        this.resources.inputShape.setData(this.image);

        this.resources.shapeViewerTexture = new Texture(this.gl, {
            shape: [480, 480],
            type: 'RGBA8',
            createFramebuffer: true,
        });
        this.resources.shapeViewerTexture.setup();
        this.resources.shapeViewerTexture.setData(this.image);

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
            shape: [90,1],
            type: 'R32F',
            createFramebuffer: true,
            textureOptions: {
                minFilter: this.gl.LINEAR,
                magFilter: this.gl.LINEAR,
                wrapS: this.gl.CLAMP_TO_EDGE,
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
            void main() {
                float angle = v_texCoord.x * 6.28318530718; 
                vec2 p1 = shapePoint;
                vec2 p2 = vec2(cos(angle), sin(angle)) * sqrt(2.);
                vec2 mid = (p1 + p2) * 0.5;
                for (int i = 0; i < 32; i++) {
                    float val = texture(u_texture, toUV(mid)).r;
                    bool inShape = val > .5;
                    if (inShape) {
                        p1 = mid;
                    } else {
                        p2 = mid;
                    }
                    mid = (p1 + p2) * 0.5;
                }
                distanceValue = sqrt(dot(mid, mid)) / sqrt(2.0); 
            }
        `,
            vertexProviderSignature: this.resources.fullscreenQuadVertexProviderSignature,
            uniformProviderSignature: this.resources.uniformProviderSignature
        });
        this.resources.distanceComputationProgram.setup();

        this.resources.mainCanvasDistanceRendererProgram = new Program(this.gl, {
            vertexShader: `
            out vec2 v_texCoord;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_position;
            }
        `,
            fragmentShader: `
            out vec4 outColor;
            in vec2 v_texCoord;
            uniform sampler2D u_texture;
            void main() {
                float normedDistance = sqrt(dot(v_texCoord, v_texCoord)) / sqrt(2.0);
                float angle = (atan(v_texCoord.y, v_texCoord.x) + 3.14159265) / 6.28318530718;
                //float targetDistance = texture(u_texture, vec2(angle, 0.5)).r ;
                float targetDistance = 0;
                int samples = 5;
                float delta = 0.01;
                for (int i = 0; i < samples; i++) {
                    float i_f = float(i);
                    float pos = angle + (i_f - 0.5 / float(samples)) * delta;
                    targetDistance += texture(u_texture, vec2(pos, 0.5)).r;
                }
                targetDistance /= float(samples);
                float currentDistance = normedDistance;
                float distance = currentDistance - targetDistance;
                //distance = smoothstep(0.0, 0.1, distance);
                distance = max(distance, 0.0);
                float outC = sin(distance * 3.14159265 * 7.) * 0.5 + 0.5;
                outColor = vec4(vec3(outC),1.);
                //outColor = vec4(vec3(texture(u_texture, v_texCoord * 0.5 + 0.5).r), 1.0);
                //outColor = vec4(distance, distance, distance, 1.0);
                //outColor = vec4(texture(u_texture, v_texCoord * 0.5 + 0.5).rgb, 1.0);
            }
        `,
            vertexProviderSignature: this.resources.fullscreenQuadVertexProviderSignature,
            uniformProviderSignature: this.resources.uniformProviderSignature
        });
        this.resources.mainCanvasDistanceRendererProgram.setup();
    }

    // init() {
    //     // setup uniform buffer
    //     this.setupUniformBuffer();

    //     // setup fullscreen quad vertex buffer (will reuse for all shaders)
    //     this.setupFullScreenQuad();

    //     // setup input "shape" texture

    //     // setup processed "shape distance" texture & framebuffer

    //     // setup main canvas texture & framebuffer
    //     this.setupMainCanvasTexture();

    //     // setup shape preview texture & framebuffer
    //     this.setupShapePreviewTexture();

    //     // setup programs

    //     // setup shape processing program (essentially compute)

    //     // setup main canvas rendering program
    //     this.setupMainCanvasProgram();

    //     // setup shape preview rendering program
    //     this.setupShapePreviewProgram();


    //     // setup final screen rendering program
    //     this.setupFinalScreenProgram();
    // };

    draw() {
        // Render Pass: Compute distances
        this.gl.viewport(0, 0, 90, 1);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.resources.distanceTexture.framebuffer);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.resources.uniformProvider.setUniforms({
            shapePoint: [0, 0],
            canvasPoint: [0, 0],
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
        this.gl.viewport(0, 0, 1920, 1080);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.resources.mainCanvasTexture.framebuffer);
        this.gl.clearColor(1, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.resources.uniformProvider.setUniforms({
            shapePoint: [0, 0],
            canvasPoint: [0, 0],
            boundingBox: [1, 1, 0, 0] 
        });
        this.resources.mainCanvasDistanceRendererProgram.draw({
            uniformProvider: this.resources.uniformProvider,
            vertexProvider: this.resources.fullscreenQuadVertexProvider,
            textures: {
                u_texture: this.resources.distanceTexture
            }
        });
        // Render Pass 2: Render into shape viewer texture
        this.gl.viewport(0, 0, 500, 500);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.resources.shapeViewerTexture.framebuffer);
        this.gl.clearColor(1, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.resources.uniformProvider.setUniforms({
            shapePoint: [0, 0],
            canvasPoint: [0, 0],
            boundingBox: [1, 1, 0, 0] 
        });
        this.resources.exampleProgram.draw({
            uniformProvider: this.resources.uniformProvider,
            vertexProvider: this.resources.fullscreenQuadVertexProvider,
            textures: {
                u_texture: this.resources.inputShape
            }
        });
        // Render Pass 3, composite the final image
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.resources.uniformProvider.setUniforms({
            shapePoint: [0, 0],
            canvasPoint: [0, 0],
            boundingBox: [-1,1, 0, 0] // full canvas
        });
        this.resources.exampleProgram.draw({
            uniformProvider: this.resources.uniformProvider,
            vertexProvider: this.resources.fullscreenQuadVertexProvider,
            textures: {
                u_texture: this.resources.mainCanvasTexture
            }
        });
        this.resources.uniformProvider.setUniforms({
            shapePoint: [0, 0],
            canvasPoint: [0, 0],
            boundingBox: [0.25, -0.25, 0.5, -0.5] // full canvas
        });
        this.resources.exampleProgram.draw({
            uniformProvider: this.resources.uniformProvider,
            vertexProvider: this.resources.fullscreenQuadVertexProvider,
            textures: {
                u_texture: this.resources.shapeViewerTexture
            }
        });
    };

}
