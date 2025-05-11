import shaderCode   from './shader.wgsl?raw';  // vite/rollup-style import or fetch()
import { RaySystem } from '../../core/RaySystem.js';

export class WebGPURenderer {
    constructor(canvas, raySystem){
        this.canvas = canvas;
        this.ctx    = canvas.getContext('webgpu');
        this.raySys = raySystem;
        this.device = null;
    }

    async init(){
        const adapter = await navigator.gpu.requestAdapter();
        this.device   = await adapter.requestDevice();
        const format  = navigator.gpu.getPreferredCanvasFormat();

        this.ctx.configure({
            device : this.device,
            format,
            alphaMode:'opaque',
        });

        // ---------- GPU resources ---------------------------------
        // one storage buffer big enough for worst-case rays
        const max = RaySystem.HARD_MAX;
        this.rayBuf = this.device.createBuffer({
            size: max * 12 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        // tiny uniform for resolution + center
        this.uniformBuf = this.device.createBuffer({
            size: 16,
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
              }
            ]
          });
        this.bindGroup = this.device.createBindGroup({
            layout:bindGroupLayout,
            entries:[
              {binding:0, resource:{buffer:this.uniformBuf}},
              {binding:1, resource:{buffer:this.rayBuf}},
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

    /*------------------------------------------------------------*/
    draw(){
        const {device,raySys} = this;
        if (!device) return;

        // upload latest ray data
        const INSTANCES = raySys.count; // raySys.count;
        if (raySys.count){
            const slice = raySys.buffer.subarray(0, INSTANCES * 12);
            this.device.queue.writeBuffer(this.rayBuf, 0, slice);
        };

        // upload uniforms
        const res = new Float32Array([this.canvas.width,this.canvas.height, 0.5,0.5]);
        device.queue.writeBuffer(this.uniformBuf, 0, res);

        // record pass
        const encoder = device.createCommandEncoder();
        const view    = this.ctx.getCurrentTexture().createView();
        const [r,g,b] = raySys.BACKGROUND_COLOR;
        const pass    = encoder.beginRenderPass({
            colorAttachments:[{
                view, clearValue:{r,g,b,a:1},
                loadOp:'clear', storeOp:'store'
            }]
        });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0,this.bindGroup);
        pass.setVertexBuffer(0,this.vertBuf);
        if (raySys.count)
            pass.draw(6, INSTANCES);   // 6 verts, N instances
        pass.end();
        device.queue.submit([encoder.finish()]);
    }
}
