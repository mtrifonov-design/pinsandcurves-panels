// TriMesh.ts
import { SimpleWebGL2 } from '../../../../LibrariesAndUtils/SimpleWebGL2/index.js';
import Delaunator from 'delaunator';

interface TriMesh {
  upload(points: { x: number; y: number; z: number }[]): void;
  draw(): void;
}

export function initTriMesh(): TriMesh {
  const gl = SimpleWebGL2.__getgl__();

  // --- compile shaders ---
  const vsSrc = `#version 300 es
  in vec2  a_pos;
  in float a_z;
  out float v_z;
  void main() {
    v_z = a_z;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }`;

  const fsSrc = `#version 300 es
  precision mediump float;
  in  float v_z;
  out vec4  outColor;
  void main() {
    float g = (v_z + 1.0) * 0.5;
    outColor = vec4(vec3(g), 1.0);
  }`;

  function compile(src: string, type: number): WebGLShader {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) || 'Shader error');
    }
    return sh;
  }

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(vsSrc, gl.VERTEX_SHADER));
  gl.attachShader(prog, compile(fsSrc, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || 'Link error');
  }

  // --- buffers and VAO ---
  const vao = gl.createVertexArray()!;
  const vbo = gl.createBuffer()!;
  const ibo = gl.createBuffer()!;

  const locPos = gl.getAttribLocation(prog, 'a_pos');
  const locZ = gl.getAttribLocation(prog, 'a_z');

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(locPos);
  gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 12, 0);
  gl.enableVertexAttribArray(locZ);
  gl.vertexAttribPointer(locZ, 1, gl.FLOAT, false, 12, 8);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bindVertexArray(null);

  // --- internal state ---
  let indexCount = 0;

  function upload(points: {x:number;y:number;z:number}[]) {
  if (points.length < 3) { indexCount = 0; return; }

  /* 1) flat coordinates for constructor ---------------------------- */
  const flat = new Float64Array(points.length * 2);
  points.forEach((p, i) => { flat[i*2] = p.x; flat[i*2+1] = p.y; });

  const dela = new Delaunator(flat);              // ✅ ctor, not .from()
  const idx  = new Uint32Array(dela.triangles);
  indexCount = idx.length;

  /* 2) interleaved vertex data [x,y,z] ------------------------------ */
  const verts = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    verts[i*3+0] = p.x;
    verts[i*3+1] = p.y;
    verts[i*3+2] = p.z;
  });

  /* 3) upload ------------------------------------------------------- */
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.DYNAMIC_DRAW);
}

  function draw() {
    if (indexCount === 0) return;
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
  }

  return { upload, draw };
}
