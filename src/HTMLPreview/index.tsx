import { useRef } from "react";
import FullscreenLoader from "../FullscreenLoader/FullscreenLoader";
import { useAssets } from "../AssetManager/hooks/useAssets";
import { AssetProvider } from "../AssetManager/context/AssetProvider";
import { useIndex } from "../AssetManager/hooks/useIndex";
import AssetResolver from "./AssetResolver";
import HTMLPreviewContent from "./HTMLPreviewContent";
import TimelineProvider from "../TimelineUtils/TimelineProvider";

class TextController {
    initialised = false
    data : any;
    constructor() {}
    load(data : any) {
        this.data = data;
        this.initialised = true;
    }
    receiveUpdate(update: any) {
        this.data = update;
    }
    destroy() {
        this.data = undefined;
        this.initialised = false;
    }
    receiveMetadataUpdate(update: any) {}
    getSnapshot() {
        return this.data;
    }
    update : (u: any) => void;
    updateMetadata : (m: any) => void;
    create : (c: any) => void;
    delete : (d: any) => void;
    subscribe : (s: any) => void;
    unsubscribe : (u: any) => void;
    setHooks(hooks) {
        this.update = hooks.update;
        this.create = hooks.create;
        this.delete = hooks.delete;
        this.subscribe = hooks.subscribe;
        this.unsubscribe = hooks.unsubscribe;
        this.updateMetadata = hooks.updateMetadata;
    }
}


function HTMLPreview() {
    const { initialized: initializedIndex, index } = useIndex();
    const tControllers = useRef<{
        [key: string]: TextController
    }>({})
    const allowedTypes = ["js", "html", "css"];
    const requestedAssets = initializedIndex ? Object.entries(index.data)
        .filter(([assetId,assetMetadata]) => allowedTypes.includes(assetMetadata.type))
        .map(([assetId,assetMetadata]) => {
            //console.log("Asset metadata", assetMetadata);
            if (tControllers.current[assetId] === undefined) {
                tControllers.current[assetId] = new TextController();
            }
            return {
            assetId: assetId,
            assetController: tControllers.current[assetId],
        }})
        : []
    //console.log("Requested assets", requestedAssets);
    const { initialized: initializedAssets, assets } = useAssets(
        requestedAssets,
    );

    const initialized = initializedIndex && initializedAssets;
    if (!initialized) {
        return <FullscreenLoader />
    }

    const collectedAssets = {};
    Object.entries(assets)
        .forEach(([assetId, asset]) => {
            const assetName = index.data[assetId].name;
            const innerString = asset.data;
            collectedAssets[assetName] = {
                type: index.data[assetId].type,
                content: innerString,
            }
    })

    if (collectedAssets["index.html"] === undefined) {
        return <div>
            No index.html found
        </div>
    }

    return <div style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: "grid",
        gridTemplateRows: "50px 1fr",
    }}>
        <TimelineProvider>  
            <AssetResolver assets={collectedAssets}>
                <HTMLPreviewContent />
            </AssetResolver>
        </TimelineProvider>
    </div>
}


export default function Index() {
    return <AssetProvider>
        <HTMLPreview /> 
    </AssetProvider>
}
