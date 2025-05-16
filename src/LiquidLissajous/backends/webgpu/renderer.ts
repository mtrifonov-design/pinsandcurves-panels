// @ts-nocheck
import shaderCode   from './shader.wgsl?raw';
import { ParticleSystem } from '../../core/ParticleSystem.js';

export class WebGPURenderer {
    constructor(canvas, particleSystem) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('webgpu',{
            preserveDrawingBuffer:true, 
        });
        this.particleSys = particleSystem;
        this.device = null;
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device   = await adapter.requestDevice();
        const format  = navigator.gpu.getPreferredCanvasFormat();

        this.ctx.configure({
            device : this.device,
            format,
            alphaMode:'opaque',
        });

        // ---------- GPU resources ---------------------------------
        // one storage buffer big enough for worst-case particles
        const max = ParticleSystem.HARD_MAX;
        this.particleBuf = this.device.createBuffer({
            size: max * 5 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        // tiny uniform for resolution + center
        this.uniformBuf = this.device.createBuffer({
            size: 48, // 2 vec2<f32> = 32 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        // new: separate uniform buffer for count
        this.countBuf = this.device.createBuffer({
            size: 4, // u32
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
              {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }
              },
              {
                binding: 1,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'read-only-storage' }
              },
              {
                binding: 2,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }
              }
            ]
          });
        this.bindGroup = this.device.createBindGroup({
            layout:bindGroupLayout,
            entries:[
              {binding:0, resource:{buffer:this.uniformBuf}},
              {binding:1, resource:{buffer:this.particleBuf}},
              {binding:2, resource:{buffer:this.countBuf}},
            ]
        });

        // full-screen quad: two triangles in clip-space
        this.vertBuf = this.device.createBuffer({
            size: 6*2*4,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation:true
        });
        new Float32Array(this.vertBuf.getMappedRange()).set([
            0,-1,  0,1,  1,1,
            0,-1,   1,1,  1,-1
        ]);
        this.vertBuf.unmap();

        this.pipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({bindGroupLayouts:[bindGroupLayout]}),
            vertex:{
                module:this.device.createShaderModule({code:shaderCode}),
                entryPoint:'vs_main',
                buffers:[{arrayStride:8, attributes:[{shaderLocation:0, format:'float32x2', offset:0}]}]
            },
            fragment:{
                module:this.device.createShaderModule({code:shaderCode}),
                entryPoint:'fs_main',
                targets:[{
                    format, 
                    blend: {
                        color: {
                            operation:'add',
                            srcFactor:'one',
                            dstFactor:'one'
                        },
                        alpha: {
                            operation:'add',
                            srcFactor:'one',
                            dstFactor:'one'
                        }
                    }
                }]
            },
            primitive:{topology:'triangle-list'},
        });
    }

    async onFrameReady(cb) {
        if (!this.device) return;
        await this.device.queue.onSubmittedWorkDone();
        cb();
    }

    draw() {
        const {device,particleSys} = this;
        if (!device) return;

        // Defensive checks for uniforms
        if (
            isNaN(this.canvas.width) || isNaN(this.canvas.height) ||
            isNaN(particleSys.CENTER_X) || isNaN(particleSys.CENTER_Y) ||
            isNaN(particleSys.PARTICLE_COUNT)
        ) {
            console.error('Uniform contains NaN!', {
                width: this.canvas.width,
                height: this.canvas.height,
                CENTER_X: particleSys.CENTER_X,
                CENTER_Y: particleSys.CENTER_Y,
                PARTICLE_COUNT: particleSys.PARTICLE_COUNT
            });
            throw new Error('Uniform contains NaN!');
        }

        // Defensive check for buffer size
        const INSTANCES = particleSys.PARTICLE_COUNT;
        if (INSTANCES * 5 > particleSys.buffer.length) {
            console.error('Particle buffer overflow!', {
                INSTANCES,
                bufferLength: particleSys.buffer.length
            });
            throw new Error('Particle buffer overflow!');
        }
        // upload latest particle data
        if (INSTANCES){
            const slice = particleSys.buffer.subarray(0, INSTANCES * 5);
            device.queue.writeBuffer(this.particleBuf, 0, slice);
        };

        // upload uniforms (resolution + center)
        const res = new Float32Array([
            this.canvas.width, this.canvas.height, 0, 0, // resolution (vec2) + padding
            particleSys.CENTER_X, particleSys.CENTER_Y, 0, 0, // center (vec2) + padding
            0,0,0,0
        ]);
        device.queue.writeBuffer(this.uniformBuf, 0, res);
        // upload count as u32
        const countArr = new Uint32Array([particleSys.PARTICLE_COUNT]);
        device.queue.writeBuffer(this.countBuf, 0, countArr);

        // record 
        const encoder = device.createCommandEncoder();
        const view    = this.ctx.getCurrentTexture().createView();
        const [r,g,b] = particleSys.BACKGROUND_COLOR;
        const pass    = encoder.beginRenderPass({
            colorAttachments:[{
                view, clearValue:{r,g,b,a:1},
                loadOp:'clear', storeOp:'store'
            }]
        });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0,this.bindGroup);
        pass.setVertexBuffer(0,this.vertBuf);
        pass.draw(6, 1);   // 6 verts, 1 instance (full screen)
        pass.end();
        device.queue.submit([encoder.finish()]);
    }
}
