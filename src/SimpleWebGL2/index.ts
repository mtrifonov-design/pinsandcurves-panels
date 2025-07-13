/*======================================================================*\
 |  MiniWebGL2 – ultra-small WebGL2 instanced-quad helper (TypeScript)   |
 |                                                                       |
 |  Six-function public API (names enclosed in double underscores):      |
 |                                                                       |
 |    MiniWebGL2.__init__(canvas)                                        |
 |    MiniWebGL2.__defineobject__(definition)                            |
 |    MiniWebGL2.__end__init__()                                         |
 |                                                                       |
 |    MiniWebGL2.__begin__()                                             |
 |    MiniWebGL2.__drawobjectinstances__(typeName, drawParams)           |
 |    MiniWebGL2.__end__()                                               |
 |                                                                       |
 |  – Each object type represents one instanced quad.                    |
 |  – Caller supplies vertex + fragment shaders per type.                |
 |  – Per-instance attributes are packed into a single interleaved VBO.  |
 |  – Optionally a shared floating-point texture may be updated per draw |
 |    call to provide dynamic data common to all instances in the batch. |
 \*======================================================================*/

// Disable lint / prettier reformatting for long GLSL and comments
// eslint-disable prettier/prettier

/*======================================================================
  1.  Public TypeScript interfaces
  =====================================================================*/
export interface InstanceAttribute {
  name: string;            // attribute name as used inside the shaders
  size: 1 | 2 | 3 | 4;     // vec size (# of floats)
  type?: 'float' | 'int';  // optional: 'int' for integer attributes, default is 'float'
}

export interface DynamicDataDesc {
  width: number;           // texture width  (Texel count, not pixels)
  height: number;          // texture height (1-D array    → height = 1)
}

export interface ObjectDefinition {
  name: string;                              // unique key, e.g. "circle"
  instanceAttributes: InstanceAttribute[];   // per-instance streams
  vertexShader: string;                      // GLSL ES 3.0 vertex shader
  fragmentShader: string;                    // GLSL ES 3.0 fragment shader
  dynamicData?: DynamicDataDesc;             // omit for none
}

export interface DrawParams {
  count: number;                             // instance count (≥ 1)
  attributes: Record<string, Float32Array>;  // one entry per attr name
  dynamicData?: Float32Array;                // optional tex upload
  blendMode?: {
    func?: [number, number]; // [sfactor, dfactor] for gl.blendFunc
    equation?: number;       // for gl.blendEquation
    mode?: string;           // e.g. "add", "regular" (optional, preferred)
  } | string; // allow passing just a string for convenience
  textures?: Record<string,string>
}

export type TexData = Uint8Array | Float32Array;
export interface TextureSpec {
  name: string;
  width: number;
  height: number;
  filter?: 'nearest' | 'linear';
  wrap?: 'clamp' | 'repeat';
  initial?: TexData;
}

/*======================================================================
  2.  Internals
  =====================================================================*/

// Short local alias
type GL = WebGL2RenderingContext;

interface ObjectType {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  instVBO: WebGLBuffer;
  stride: number;                       // bytes per instance in instVBO
  attributes: InstanceAttribute[];
  dynTex?: WebGLTexture;                // optional texture
  dynUniformLoc?: WebGLUniformLocation; // sampler uniform location
  dynW?: number;
  dynH?: number;
}

let gl: GL | null = null;                               // active GL context
const objectTypes: Record<string, ObjectType> = Object.create(null);

/*======================================================================
  3.  Public API object
  =====================================================================*/
export const SimpleWebGL2 = {
  __init__,
  __defineobject__,
  __createtexture__,
  __updatetexture__,
  __end__init__,
  __begin__,
  __drawobjectinstances__,
  __end__,
  __getgl__: __getgl__,
  __adopttexture__: __adopttexture__,
};

/*======================================================================
  4.  Implementation
  =====================================================================*/

function __adopttexture__(name: string,
                           tex: WebGLTexture,
                           width: number,
                           height: number): void {
  textures[name] = { tex, width, height };
}

function __getgl__(): WebGL2RenderingContext {
  if (!gl) throw new Error("Call __init__ first");
  return gl;
}


/*----------------------------- __init__ ------------------------------*/
function __init__(canvas: HTMLCanvasElement): void {
  gl = canvas.getContext("webgl2", { antialias: false });
  if (!gl) throw new Error("WebGL 2 not supported by this browser");

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
}

/*-------------------------- __defineobject__ -------------------------*/
function __defineobject__(def: ObjectDefinition): void {
  if (!gl) throw new Error("Call __init__ first");
  const glCtx = gl!; // Non-null assertion for the rest of the function
  if (objectTypes[def.name])
    throw new Error(`Object type "${def.name}" already exists`);
  if (!Array.isArray(def.instanceAttributes))
    throw new Error("instanceAttributes must be an array");

  /* 1.  Compile + link the user-provided shaders */
  const program = linkProgram(def.vertexShader, def.fragmentShader);

  /* 2.  Create static GPU resources */
  const vao = glCtx.createVertexArray()!;
  const vboQuad = glCtx.createBuffer()!;
  const iboQuad = glCtx.createBuffer()!;
  const instVBO = glCtx.createBuffer()!;

  /* 3.  Upload a unit quad covering −1…1 in clip-space */
  glCtx.bindBuffer(glCtx.ARRAY_BUFFER, vboQuad);
  glCtx.bufferData(
    glCtx.ARRAY_BUFFER,
    new Float32Array([ -1, -1,   1, -1,   1, 1,   -1, 1 ]),
    glCtx.STATIC_DRAW,
  );

  glCtx.bindBuffer(glCtx.ELEMENT_ARRAY_BUFFER, iboQuad);
  glCtx.bufferData(
    glCtx.ELEMENT_ARRAY_BUFFER,
    new Uint16Array([ 0, 1, 2,   0, 2, 3 ]),
    glCtx.STATIC_DRAW,
  );

  /* 4.  Configure VAO --------------------------------------------------*/
  glCtx.bindVertexArray(vao);
  // Bind element array inside VAO – avoids GL_INVALID_OPERATION later
  glCtx.bindBuffer(glCtx.ELEMENT_ARRAY_BUFFER, iboQuad);

  // Attribute 0 → vertex position (in vec2 a_pos)
  const locPos = glCtx.getAttribLocation(program, "a_pos");
  if (locPos < 0)
    throw new Error("vertex shader must declare 'in vec2 a_pos'");

  glCtx.bindBuffer(glCtx.ARRAY_BUFFER, vboQuad);
  glCtx.enableVertexAttribArray(locPos);
  glCtx.vertexAttribPointer(locPos, 2, glCtx.FLOAT, false, 0, 0);
  glCtx.vertexAttribDivisor(locPos, 0);  // per-vertex

  // Interleaved instance buffer
  glCtx.bindBuffer(glCtx.ARRAY_BUFFER, instVBO);
  const strideFloats = def.instanceAttributes.reduce((s, a) => s + a.size, 0);
  const strideBytes  = strideFloats * 4;

  let offsetBytes = 0;
  def.instanceAttributes.forEach(attr => {
    const loc = glCtx.getAttribLocation(program, attr.name);
    if (loc < 0) throw new Error(`Shader missing attribute ${attr.name}`);
    glCtx.enableVertexAttribArray(loc);
    if (attr.type === 'int') {
      // Integer attribute
      glCtx.vertexAttribIPointer(loc, attr.size, glCtx.INT, strideBytes, offsetBytes);
    } else {
      // Default: float attribute
      glCtx.vertexAttribPointer(loc, attr.size, glCtx.FLOAT, false, strideBytes, offsetBytes);
    }
    glCtx.vertexAttribDivisor(loc, 1);          // per-instance
    offsetBytes += attr.size * 4;
  });

  glCtx.bindVertexArray(null);

  /* 5.  Optional dynamic-data texture ---------------------------------*/
  let dynTex: WebGLTexture | undefined;
  let dynUniformLoc: WebGLUniformLocation | undefined;
  let dynW = 0;
  let dynH = 0;

  if (def.dynamicData) {
    dynW = def.dynamicData.width  | 0;
    dynH = def.dynamicData.height | 0;

    dynTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, dynTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.R32F,
      dynW, dynH, 0,
      gl.RED, gl.FLOAT, null,
    );

    dynUniformLoc = gl.getUniformLocation(program, "u_dyn") || undefined;
  }

  /* 6.  Record descriptor */
  objectTypes[def.name] = {
    program,
    vao,
    instVBO,
    stride: strideBytes,
    attributes: def.instanceAttributes,
    dynTex,
    dynUniformLoc,
    dynW,
    dynH,
  };
}

function __end__init__(): void {
  /* Reserved for API completeness – does nothing currently */
}

/*------------------------------- __begin__ ---------------------------*/
function __begin__(): void {
  if (!gl) throw new Error("Call __init__ first");
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

interface TexRec {
  tex: WebGLTexture;
  width: number;
  height: number;
}

const textures: Record<string, TexRec> = {};

function __createtexture__(spec: TextureSpec): void {
  if (!gl) throw new Error("Call __init__ first");
  if (textures[spec.name]) {
    throw new Error(`Texture "${spec.name}" already exists`);
  }
  const fmt = gl.R8;
  const type = gl.UNSIGNED_BYTE;
  const base = gl.RED;

  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, spec.filter === "nearest" ? gl.NEAREST : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, spec.filter === "nearest" ? gl.NEAREST : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, spec.wrap === "clamp" ? gl.CLAMP_TO_EDGE : gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, spec.wrap === "clamp" ? gl.CLAMP_TO_EDGE : gl.REPEAT);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, fmt,
    spec.width, spec.height, 0,
    base, type, spec.initial || null,
  );
  textures[spec.name] = {
    tex,
    width: spec.width,
    height: spec.height,
  };
}

function __updatetexture__(name: string, data: TexData): void {
  if (!gl) throw new Error("Call __init__ first");
  const t = textures[name];
  if (!t) throw new Error(`Texture "${name}" not found`);
  gl.bindTexture(gl.TEXTURE_2D, t.tex);
  gl.texSubImage2D(
    gl.TEXTURE_2D, 0, 0, 0,
    t.width, t.height,
    gl.RED, gl.UNSIGNED_BYTE,
    data,
  );
}


/*---------------------- __drawobjectinstances__ ----------------------*/
function __drawobjectinstances__(typeName: string, params: DrawParams): void {
  if (!gl) throw new Error("Call __init__ first");
  const type = objectTypes[typeName];
  if (!type) throw new Error(`Unknown object type "${typeName}"`);



  const count = params.count | 0;
  if (count <= 0) return;

  // --- Blending mode string support ---
  let blendFunc: [number, number] | undefined;
  let blendEquation: number | undefined;
  let blendModeObj: any = params.blendMode;
  if (typeof params.blendMode === "string") {
    blendModeObj = { mode: params.blendMode };
  }
  if (blendModeObj) {
    // Map string mode to blendFunc/equation
    if (blendModeObj.mode) {
      switch (blendModeObj.mode) {
        case "add":
        case "additive":
          blendFunc = [gl.SRC_ALPHA, gl.ONE];
          blendEquation = gl.FUNC_ADD;
          break;
        case "regular":
        case "alpha":
        default:
          blendFunc = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
          blendEquation = gl.FUNC_ADD;
          break;
      }
    }
    // Allow override by explicit func/equation
    if (blendModeObj.func) blendFunc = blendModeObj.func;
    if (blendModeObj.equation !== undefined) blendEquation = blendModeObj.equation;
  } else {
    // Fallback to default blend mode
    blendFunc = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
    blendEquation = gl.FUNC_ADD;
  }
  // Set blend mode before draw (no reading/restoring)
  if (blendFunc) gl.blendFunc(blendFunc[0], blendFunc[1]);
  if (blendEquation !== undefined) gl.blendEquation(blendEquation);

  const totalStride = type.stride;
  const buffer = new ArrayBuffer(count * totalStride);

  let offsetBytes = 0;
  const attributeWriters = type.attributes.map(attr => {
    const byteOffset = offsetBytes;
    const entrySize = attr.size;
    const write = attr.type === "int"
      ? (view: DataView, val: Float32Array | Int32Array, offset: number) => {
          for (let i = 0; i < entrySize; ++i)
            view.setInt32(offset + i * 4, (val as Int32Array)[i], true);
        }
      : (view: DataView, val: Float32Array | Int32Array, offset: number) => {
          for (let i = 0; i < entrySize; ++i)
            view.setFloat32(offset + i * 4, (val as Float32Array)[i], true);
        };
    offsetBytes += entrySize * 4;
    return { name: attr.name, byteOffset, entrySize, write };
  });

  const view = new DataView(buffer);
  for (let inst = 0; inst < count; ++inst) {
    const instOffset = inst * totalStride;
    for (const attr of attributeWriters) {
      const src = params.attributes[attr.name];
      if (!src) throw new Error(`Missing attribute "${attr.name}" in draw params`);
      const sub = src.subarray(inst * attr.entrySize, (inst + 1) * attr.entrySize);
      attr.write(view, sub, instOffset + attr.byteOffset);
    }
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, type.instVBO);
  gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);

  gl.useProgram(type.program);
  let texUnit = 0;

  // Optional texture update
  if (type.dynTex && params.dynamicData) {
    gl.activeTexture(gl.TEXTURE0 + texUnit);
    gl.bindTexture(gl.TEXTURE_2D, type.dynTex);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      type.dynW!,
      type.dynH!,
      gl.RED,
      gl.FLOAT,
      params.dynamicData,
    );
  }
    if (type.dynUniformLoc) {
      gl.uniform1i(type.dynUniformLoc, texUnit)
      texUnit++;
    };


  if (params && params.textures) {
    for (const [uName, texName] of Object.entries(params.textures)) {
      const rec = textures[texName];
      if (!rec) throw new Error(`Texture "${texName}" not found for unit "${uName}"`);
      gl.activeTexture(gl.TEXTURE0 + texUnit);
      gl.bindTexture(gl.TEXTURE_2D, rec.tex);
      const loc = gl.getUniformLocation(type.program, uName);
      if (loc === null) {
        throw new Error(`Uniform "${uName}" not found in program for type "${typeName}"`);
      }
      gl.uniform1i(loc, texUnit);
      texUnit++;
    }

  }



  gl.bindVertexArray(type.vao);
  gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, count);
  gl.bindVertexArray(null);
}


/*-------------------------------- __end__ ----------------------------*/
function __end__(): void {
  if (gl) gl.flush();
}

/*======================================================================
  5.  Small GLSL helper functions
  =====================================================================*/
function compileShader(src: string, typeEnum: number): WebGLShader {
  const sh = gl!.createShader(typeEnum)!;
  gl!.shaderSource(sh, src);
  gl!.compileShader(sh);
  if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
    throw new Error(gl!.getShaderInfoLog(sh) || "shader compile error");
  }
  return sh;
}

function linkProgram(vsSrc: string, fsSrc: string): WebGLProgram {
  const prog = gl!.createProgram()!;
  gl!.attachShader(prog, compileShader(vsSrc, gl!.VERTEX_SHADER));
  gl!.attachShader(prog, compileShader(fsSrc, gl!.FRAGMENT_SHADER));
  gl!.linkProgram(prog);
  if (!gl!.getProgramParameter(prog, gl!.LINK_STATUS)) {
    throw new Error(gl!.getProgramInfoLog(prog) || "program link error");
  }
  // Optional: detach shaders to free driver memory
  const attached = gl!.getAttachedShaders(prog) || [];
  attached.forEach(sh => gl!.detachShader(prog, sh));
  return prog;
}

/*======================================================================
  End of file
  =====================================================================*/
