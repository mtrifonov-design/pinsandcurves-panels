import Program from "./HelperLib/Program";
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
        this.setup();
    }

    resources = {};
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
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = texCoord;
            }
            `,
            fragmentShader: `
            out vec4 outColor;
            void main() {
                outColor = vec4(1.,0.,0.,1.);
            }
            `,
            vertexProviderSignature: this.resources.fullscreenQuadVertexProviderSignature,
            uniformProviderSignature: this.resources.uniformProviderSignature
        });
        this.resources.exampleProgram.setup();
    }

    init() {
        // setup uniform buffer
        this.setupUniformBuffer();

        // setup fullscreen quad vertex buffer (will reuse for all shaders)
        this.setupFullScreenQuad();

        // setup input "shape" texture

        // setup processed "shape distance" texture & framebuffer

        // setup main canvas texture & framebuffer
        this.setupMainCanvasTexture();

        // setup shape preview texture & framebuffer
        this.setupShapePreviewTexture();

        // setup programs

        // setup shape processing program (essentially compute)

        // setup main canvas rendering program
        this.setupMainCanvasProgram();

        // setup shape preview rendering program
        this.setupShapePreviewProgram();


        // setup final screen rendering program
        this.setupFinalScreenProgram();
    };

    draw() {
        this.resources.uniformProvider.setUniforms({
            shapePoint: [0, 0],
            canvasPoint: [0, 0],
            boundingBox: [0, 0, 1, 1] // full canvas
        });
        this.resources.fullscreenQuadVertexProvider.setVertexData({
            a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0],
            texCoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]
        })
        this.resources.fullscreenQuadVertexProvider.setIndexData([0, 1, 2, 1, 3, 2]);
        this.resources.exampleProgram.draw({
            uniformProvider: this.resources.uniformProvider,
            vertexProvider: this.resources.fullscreenQuadVertexProvider,
        });
    };

}
