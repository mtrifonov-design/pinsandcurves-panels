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
- ```graph : (ObjectId,Object)[]```
- ```persistentPhysicalResources : Map<PhysicalResourceId -> PhysicalResource>```
- ```pooledPhysicalResources : (TextureSignatureId,PhysicalResource)[]```
- ```gpuBackend : GPUBackend```
- ```physicalResourceIsResident : Map<TransientTextureId -> PhysicalResourceId or undefined>```
- ```resourceIsDirty : Map<ResourceId -> Boolean>```
- ```textureRotationIndex : Map<RotatingTextureId -> Integer>```
- ```targetTexture : textureId```

The top level ```engine``` object has the following methods (see API section):

- ```recompile : (graph: (objectId,Object)[]) => void```
- ```setInput : (id:resourceId, input: ResourceInput) => void```
- ```updateScreen : () => void```
- ```setTargetTexture : (i : textureId) => void```
- ```captureTexture : (i : textureId) => textureData```


## Datastructure
The top level ```engine``` object holds the following state:
- ```graph : (ObjectId,Object)[]```\
    There are two categories of ```Object```: ```Signature``` and ```Resource```.\
    Exhaustively, there are:
    - TextureSignature ```{ size : [number, number], type: RGBA8, R8, R32F, R16F ... }```
    - StaticTexture ```{ signature: SignatureId }```
    - RotatingTexture ```{ signature: SignatureId, length: Number, drawOps: DrawOp[] }```
    - TransientTexture ```{ signature: SignatureId, drawOps: DrawOp[] }```
    - VertexSignature ```{ maxVertexCount, attributes }```
    - Vertex ```{ signature: SignatureId }```
    - InstanceSignature ```{ maxInstanceCount, attributes }```
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
- ```physicalResourceIsResident : Map<TransientTextureId -> physicalResourceId or undefined>```\
    A transient textures can be "inhabited" or not, depending on whether we have associated a physical texture with it.
- ```resourceIsDirty : Map<ResourceId -> Boolean>```\
    The following resources can be dirty:
    - StaticTexture, RotatingTexture, TransientTexture, Vertex, Instance, Global, Program
- ```textureRotationIndex : Map<RotatingTextureId -> Integer>```\
    A Rotating texture has a 'currently active' texture, here we save its index.
- ```targetTexture : textureId```
    The id of the chosen target texture. Can be static, rotating or transient.

## API
The top level ```engine``` object has the following methods:

- ```recompile : (graph: (objectId,Object)[], targetTextureId) => void```\
    Infrequently (at most every couple seconds), we recompile our Object graph. We call this graph, because the objects have dependencies, and in sum, they make up a DAG. Every time we recompile, the following steps are executed:
    - We diff the new graph against the existing graph.
    - We remove objects that are no longer present. If they have corresponding persistent physical resources, we destroy these. If they correspond to transient textures, we remove them from the "physicalResourceResident" map. If they correspond to textures that can be dirty, we remove them from the dirty map.
    - We add resources that previously didn't exist. If their resource type demands it, we initialize persistent physical resources (applies to vertex, instance, global, static texture, rotating texture). We mark those resources as sources for the dirty propogation algorithm.
    - We perform the dirty propagation algorithm, which marks textures that depend on marked as source or dirty resources as themselves dirty.
    - We call 'setTargetTexture' with the provided targetTextureId.

- ```setTargetTexture : (i : textureId) => void```\
    This method allows us to decide which texture we want to use as a 'target', either for blitting to the screen, or capturing pixels. Based on this decision, we need to adjust the pool of physical resources we provision.
    - Now we compute the draw sequence and texture lifetimes datastructure without setting "considerDirtyAndResident".
    - Now we simply determine the maxium number of transient textures of each signature that are simultaneously in use
    - Finally, we equalize. We delete physically allocated textures if they exceed the determined number of necessary textures, and we create new physical textures when we have determined that they are required.
    

- ```setInput : (id:resourceId, input: ResourceInput) => void```\
    Setting input applies to static textures, vertex, global and instance. In short, we issue calls that provide the data to be uploaded to the GPU to the provisioned physical resources.
    Every time this function is called, we run the dirty propogation algorithm, which is responsible to find all objects that depend on the dirty object and mark themselves as dirty.
- ```updateScreen : () => void```
    We update the target texture and blit it to the screen.
- ```captureTexture : (i : textureId) => textureData```
    We update the target texture and read its pixels out.
- [internal] ```computeDrawSequenceAndTextureLifetimes : (considerDirtyAndResident: boolean) => (drawSequence,textureLifetimes)```\
    - First we recursively 'trim' the graph as to obtain a representation of all nodes that are connected to the target texture,
    but only from the dependencies side. 
    - We filter these objects for transient textures only. If "considerDirtyAndResident" is set, we don't consider transient textures that are not dirty and resident.
    - We flatten our trimmed graph using a topological sort into a sequence of 'draw passes'.
    - We do this by splitting each dynamic texture into its draw operations
    - To each draw pass we associate the involved transient textures. This is the final draw sequence datastructure.
    - Now, for each unique transient texture in the graph, we traverse the sequence of draw passes and record the first and last use index, this will be the lifetime of the texture
- [internal] ```updateTargetTexture : () => void```\
    - First we compute the draw sequence and texture lifetimes datastructures with setting the "considerDirtyAndResident" flag. 
    - Now we walk the draw sequence.
    - For each draw entry, we perform the associated draw operation. In order to do this, we may need to bind resources.
    - If we need a transient texture that is not resident, we set it to resident and bind a physical resource from the pool. 
    We do this by first trying to use physical textures that are not bound, but if we can't, we will 'release' a bound physical resource whose lifetime has expired.
    - Each time we have worked through all draw operations of a dynamic texture, we lift the dirty flag from it.
    - Finally, all transient textures should no longer be dirty, and we should have left physical resources resident wherever we could, in the hopes of avoiding future work.




