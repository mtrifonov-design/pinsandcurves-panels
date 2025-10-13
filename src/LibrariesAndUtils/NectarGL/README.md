# NectarGL
A 2D render engine.

## Contents
- Datastructure
- API
- Resources
- Mapping from logical to physical resources
- UpdateTexture

## Overview
The top level ```engine``` object holds the following state (see Datastructure section):
- ```objects : (ObjectId,Object)[]```
- ```persistentPhysicalResources : Map<PhysicalResourceId -> PhysicalResource>```
- ```pooledPhysicalResources : (TextureSignatureId,PhysicalResource)[]```
- ```gpuBackend : GPUBackend```
- ```physicalResourceIsResident : Map<TransientTextureId -> Boolean>```
- ```resourceIsDirty : Map<ResourceId -> Boolean>```
- ```textureRotationIndex : Map<RotatingTextureId -> Integer>```
- ```screenTexture : textureId```

The top level ```engine``` object has the following methods (see API section):

- ```recompile : (graph: (objectId,Object)[]) => void```
- ```setInput : (id:resourceId, input: ResourceInput) => void```
- ```updateScreen : () => void```
- ```setScreen : (i : textureId) => void```
- ```captureTexture : (i : textureId) => textureData```


## Datastructure
The top level ```engine``` object holds the following state:
- ```objects : (ObjectId,Object)[]```\
    There are two categories of ```Object```: ```Signature``` and ```Resource```.\
    Exhaustively, there are:
    - TextureSignature ```{ size : [number, number], type: RGBA8, R8, R32F, R16F ... }```
    - StaticTexture ```{ signature: SignatureId }```
    - RotatingTexture ```{ signature: SignatureId, length: Number, drawOps: DrawOp[] }```
    - TransientTexture ```{ signature: SignatureId, drawOps: DrawOp[] }```
    - VertexSignature ```{ ... }```
    - Vertex ```{ signature: SignatureId }```
    - InstanceSignature ```{ ... }```
    - Instance ```{ signature: SignatureId }```
    - GlobalSignature ```{ ... }```
    - Global ```{ signature: SignatureId }```
    - Program ```{ ... }```

- ```persistentPhysicalResources : Map<PhysicalResourceId -> PhysicalResource>```\
    Some resources strictly correspond to physical resources on the GPU. These are:
    - StaticTexture (Texture)
    - RotatingTexture (Multiple Textures)
    - Vertex (VertexBuffer + IndexBuffer)
    - Instance (InstanceBuffer)
    - Global (UniformBuffer)
- ```pooledPhysicalResources : (TextureSignatureId,PhysicalResource)[]```\
    Transient textures do not get their own physical resource handle, as they are eligible for aliasing.
    Here, we store the maximum amount of textures we might need to perform any render pass.
- ```gpuBackend : GPUBackend```\
    This is an API-agnostic handle to some GPU backend that allows us to do standard things, like set up render passes,
    draw calls, etc.
- ```physicalResourceIsResident : Map<TransientTextureId -> Boolean>```\
    A transient textures can be "inhabited" or not, depending on whether we have associated a physical texture with it.
- ```resourceIsDirty : Map<ResourceId -> Boolean>```\
    The following resources can be dirty:
    - StaticTexture, RotatingTexture, TransientTexture, Vertex, Instance, Global, Program
- ```textureRotationIndex : Map<RotatingTextureId -> Integer>```\
    A Rotating texture has a 'currently active' texture, here we save its index.
- ```screenTexture : textureId```
    The id of the chosen texture to blit to the screen. Can be static, rotating or transient.

## API
The top level ```engine``` object has the following methods:

- ```recompile : (graph: (objectId,Object)[]) => void```\
    Infrequently (at most every couple seconds), we recompile our Object graph. We call this graph, because the objects have dependencies, and in sum, they make up a DAG. Every time we recompile, the following steps are executed:
    - We remove resources that are no longer present. If they have corresponding persistent physical resources, we destroy these.
    - We add resources that previously didn't exist. If their resource type demands it, we initialize persistent physical resources (applies to vertex, instance, global, static texture, rotating texture). We mark those resources as dirty.
    - For each TextureSignature that is used by at least one transient texture in the new graph, we compute the required number of physical resources to be able to service any request (*More on that TODO*).

- ```setInput : (id:resourceId, input: ResourceInput) => void```
- ```updateScreen : () => void```
- ```setScreen : (i : textureId) => void```
- ```captureTexture : (i : textureId) => textureData```

##


