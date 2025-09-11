type GraphicAsset = {
    sourceId: string;
    source: any;
}

type ControlsAsset = {
    sourceId: string;
    renderState: {
        [key: string]: any;
    };
}

type CompositionDescription = {
    layers: LayerDescription[];
    canvasDimensions: [number, number];
}


type LayerDescription = {
    effects: EffectDescription[];
    adjustment? : boolean;
    blend: string;
}

type EffectDescription = {
    instanceId: string;
}

type SourceRegistry = {
    currentSourceId: string;
    instances: {
        [instanceId: string]: string
    };
}

export type {
    GraphicAsset,
    ControlsAsset,
    CompositionDescription,
    LayerDescription,
    EffectDescription,
    SourceRegistry
}