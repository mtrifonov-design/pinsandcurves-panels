type TextureType =
    | 'RGBA8'
    | 'R8'
    | 'R32F'
    | 'RGBA32F'

type UploadInfo = {
    internalFormat: number;
    format: number;
    type: number;
};

const getUploadInfo = (t: TextureType, gl: WebGL2RenderingContext): UploadInfo => {
    switch (t) {
        case 'RGBA8':
            return { internalFormat: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE };
        case 'R8':
            return { internalFormat: gl.R8, format: gl.RED, type: gl.UNSIGNED_BYTE };
        case 'R32F':
            return { internalFormat: gl.R32F, format: gl.RED, type: gl.FLOAT };
        case 'RGBA32F':
            return { internalFormat: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT };
        default:
            throw new Error('Unknown texture type');
    }
};

type TextureDescription = {
    shape: number[];
    type: TextureType;
    createFramebuffer?: boolean;
    textureOptions? : {
        minFilter?: number;
        magFilter?: number;
        wrapS?: number;
        wrapT?: number;
    }
}


class Texture {
    description: TextureDescription;
    gl: WebGL2RenderingContext;
    constructor(gl: WebGL2RenderingContext, description: TextureDescription) {
        this.gl = gl;
        this.description = description;
    }

    framebuffer: WebGLFramebuffer | null = null;
    texture: WebGLTexture | null = null;
    setup() {
        const { internalFormat, format, type } = getUploadInfo(this.description.type, this.gl);
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, this.description.shape[0], this.description.shape[1], 0, format, type, null);

        if (this.description.textureOptions) {
            const { minFilter, magFilter, wrapS, wrapT } = this.description.textureOptions;
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, minFilter ?? this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, magFilter ?? this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, wrapS ?? this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, wrapT ?? this.gl.CLAMP_TO_EDGE);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        }

        if (this.description.createFramebuffer) {
            this.framebuffer = this.gl.createFramebuffer();
            if (!this.framebuffer) {
                throw new Error('Failed to create framebuffer');
            }
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.COLOR_ATTACHMENT0,
                this.gl.TEXTURE_2D,
                this.texture,
                0
            );
            const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
            if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
                throw new Error(`Framebuffer is not complete: ${status}`);
            }
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    setDescription(description: TextureDescription) {
        this.description = description;
        // set up the texture again with the new description
        if (this.texture) {
            this.gl.deleteTexture(this.texture);
            this.texture = null;
        }
        if (this.framebuffer) {
            this.gl.deleteFramebuffer(this.framebuffer);
            this.framebuffer = null;
        }
        this.setup();
    }

    setData(data: HTMLImageElement | Float32Array | Uint8Array) {
        if (!this.texture) throw new Error('Texture not initialized');

        const { format, type } = getUploadInfo(this.description.type, this.gl);
        const [width, height] = this.description.shape;
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        if (data instanceof HTMLImageElement) {
            const { internalFormat } = getUploadInfo(this.description.type, gl);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, data);
        } else {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, format, type, data);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
    }


}

export default Texture;