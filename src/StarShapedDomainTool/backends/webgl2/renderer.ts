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
        const imAdr = "/pinsandcurves-panels/im.jpg";
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
        this.resources.exampleTexture = new Texture(this.gl, {
            shape: [this.image.width, this.image.height],
            type: 'RGBA8',
        })
        this.resources.exampleTexture.setup();
        this.resources.exampleTexture.setData(this.image);

        this.resources.shapeViewerTexture = new Texture(this.gl, {
            shape: [300, 300],
            type: 'RGBA8',
            createFramebuffer: true,
        });
        this.resources.shapeViewerTexture.setup();
        this.resources.shapeViewerTexture.setData(this.image);

        this.resources.targetTexture = new Texture(this.gl, {
            shape: [300,300],
            type: 'RGBA8',
            createFramebuffer: true,
        })
        this.resources.targetTexture.setup();
        this.resources.fullscreenQuadVertexProvider.setVertexData({
            a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0],
            texCoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]
        })
        this.resources.fullscreenQuadVertexProvider.setIndexData([0, 1, 2, 1, 3, 2]);
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
        // Render Pass 1: Render into example texture
        this.gl.viewport(0, 0, 300, 300);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.resources.targetTexture.framebuffer);
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
                u_texture: this.resources.exampleTexture
            }
        });
        // Render Pass 2: Render into shape viewer texture
        this.gl.viewport(0, 0, 300, 300);
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
                u_texture: this.resources.exampleTexture
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
            boundingBox: [1,1, 0, 0] // full canvas
        });
        this.resources.exampleProgram.draw({
            uniformProvider: this.resources.uniformProvider,
            vertexProvider: this.resources.fullscreenQuadVertexProvider,
            textures: {
                u_texture: this.resources.targetTexture
            }
        });
        this.resources.uniformProvider.setUniforms({
            shapePoint: [0, 0],
            canvasPoint: [0, 0],
            boundingBox: [0.5, 0.5, 0.5, 0] // full canvas
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
