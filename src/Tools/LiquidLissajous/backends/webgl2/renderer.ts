// @ts-nocheck
import { ParticleSystem } from '../../core/ParticleSystem.js';
import { SimpleWebGL2 } from '../../../LibrariesAndUtils/SimpleWebGL2/index.js';
import gradientObject, { gradientDraw } from './gradientObject.js';
import circleObject, { circleDraw } from './circleObject.js';
import { computeDepthFieldTexture } from '../../core/DepthField.js';
import pathObject, { pathDraw } from './pathObject.js';
import { initTriMesh } from './TriMesh.js';
import obstacleProblem from '../../core/ObstacleProblem.js';
import depthObject, { depthDraw } from './depthObject.js';
import effectObject, { effectDraw } from './effectObject.js';

function makeTileableNoise(size = 64, float = false) {
  const N = size * size;
  if (float) {
    const d = new Float32Array(N);
    for (let i=0;i<N;++i) d[i] = Math.random();
    return d;
  } else {
    const d = new Uint8Array(N);
    crypto.getRandomValues(d);          // fast & good entropy
    return d;
  }
}


export class WebGL2Renderer {
    constructor(canvas, particleSystem) {
        this.canvas = canvas;
        this.particleSys = particleSystem;
        SimpleWebGL2.__init__(canvas);
        SimpleWebGL2.__defineobject__(circleObject);
        SimpleWebGL2.__defineobject__(pathObject);
        SimpleWebGL2.__defineobject__(gradientObject);
        SimpleWebGL2.__defineobject__(depthObject);
        SimpleWebGL2.__defineobject__(effectObject);
        SimpleWebGL2.__createtexture__({
            name: "depth_field",
            width: 8,
            height: 8,
            initial: computeDepthFieldTexture(this.particleSys, 8, 5),
            wrap: "repeat",
            filter: "linear",
            
        })
        const depthFieldTexture = computeDepthFieldTexture(this.particleSys, 16, 5);
        SimpleWebGL2.__end__init__();

        this.triMesh = initTriMesh();

        const gl = SimpleWebGL2.__getgl__();      // ① grab context

        // (a) make RGBA8 texture
        const RTV_W = 512, RTV_H = 512;
        this.RTV_W = RTV_W;
        this.RTV_H = RTV_H;
        let rtTex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, rtTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, RTV_W, RTV_H, 0,
                    gl.RGBA, gl.UNSIGNED_BYTE, null);

        // (b) adopt it so later passes can bind it by name
        SimpleWebGL2.__adopttexture__('exampleTexture', rtTex, RTV_W, RTV_H);

        // (c) framebuffer that owns the texture
        let rtFBO = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, rtFBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D,
                                rtTex, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        console.error('RT FBO incomplete');

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);   // tidy up
        this.rtFBO = rtFBO;                         // keep for draw()


        rtTex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, rtTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, RTV_W, RTV_H, 0,
                    gl.RGBA, gl.UNSIGNED_BYTE, null);

        // (b) adopt it so later passes can bind it by name
        SimpleWebGL2.__adopttexture__('example2Texture', rtTex, RTV_W, RTV_H);

        // (c) framebuffer that owns the texture
        rtFBO = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, rtFBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
                                gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D,
                                rtTex, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        console.error('RT FBO incomplete');

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);   // tidy up
        this.rt2FBO = rtFBO;                         // keep for draw()

    }

    async init() {
        return;
    }

    async onFrameReady(cb) {
        return cb();
    }

    draw() {
        const gl = SimpleWebGL2.__getgl__();

        // /* ---------- PASS 1: gradient → texture --------------------------- */
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.rtFBO);
        gl.viewport(0, 0, this.RTV_W, this.RTV_H);

        //SimpleWebGL2.__begin__();                            // clears FBO
        SimpleWebGL2.__drawobjectinstances__("depthObj", depthDraw(this.particleSys));
        
        // SimpleWebGL2.__drawobjectinstances__(
        //     'voronoiBG',
        //     gradientDraw(this.particleSys)
        // );
        SimpleWebGL2.__end__();  

        //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        //gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.rt2FBO);
        gl.viewport(0, 0, this.RTV_W, this.RTV_H);


        //SimpleWebGL2.__begin__();
        SimpleWebGL2.__drawobjectinstances__("voronoiBG", gradientDraw(this.particleSys));

        SimpleWebGL2.__end__();
        
        // SimpleWebGL2.__updatetexture__("depth_field", computeDepthFieldTexture(this.particleSys, 8, 5));


        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);



        SimpleWebGL2.__begin__();

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        

        SimpleWebGL2.__drawobjectinstances__("effectObj", effectDraw(this.particleSys));

        // const inputPoints = [
        // ]

        // this.particleSys.PARTICLES.forEach(particle => {
        //     const { x, y, z } = particle;
        //     inputPoints.push({ x: x, y: y, psi: z-1 });
        // })
        // inputPoints.push({ x: -2.1, y: -2.1, psi: -2, dir: true });
        // inputPoints.push({ x: 2.1, y: -2.1, psi: -2, dir: true });
        // inputPoints.push({ x: 2.1, y: 2.1, psi: -2, dir: true });
        // inputPoints.push({ x: -2.1, y: 2.1, psi: -2, dir: true });

        // const stepSize = 0.3;
        // for (let x = -0.9; x <= 0.9; x += stepSize) {
        //     for (let y = -0.9; y <= 0.9; y += stepSize) {
        //         // find all particles in particle system within a certain distance
        //         const distance = Math.sqrt(stepSize * stepSize + stepSize * stepSize); // 0.1 is the step size
        //         const particlesInRange = this.particleSys.PARTICLES.filter(p => {
        //             const dx = p.x - x;
        //             const dy = p.y - y;
        //             return Math.sqrt(dx * dx + dy * dy) < distance;
        //         });
        //         // pick the one with the highest z value
        //         let highestValue = -2;

        //         if (particlesInRange.length > 0) {
        //             const highestParticle = particlesInRange.reduce((max, p) => p.z > max.z ? p : max);
        //             highestValue = highestParticle.z - 1; 
        //         } 

        //         inputPoints.push({ x: x, y: y, psi: highestValue }); // default psi value
        //     }
        // }

        // const outputPoints = obstacleProblem({nodes:inputPoints, force:-3});
        // const points = outputPoints.map(p => ({ x: p.x, y: p.y, z: p.height + 1 })); // convert to clip-space

        // this.triMesh.upload(points); // clip-space coordinates
        // this.triMesh.draw();
        //SimpleWebGL2.__drawobjectinstances__("depthObj", depthDraw(this.particleSys));
        
        if (this.particleSys.SHOW_LISSAJOUS_FIGURE) {

            SimpleWebGL2.__drawobjectinstances__("path", pathDraw(this.particleSys));
            SimpleWebGL2.__drawobjectinstances__("circle",circleDraw(this.particleSys));
        }

        gl.disable(gl.DEPTH_TEST);
        SimpleWebGL2.__end__();

    }

}
