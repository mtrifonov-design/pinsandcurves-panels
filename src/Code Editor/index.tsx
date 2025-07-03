import { useEffect, useRef, useState } from "react";
import FullscreenLoader from "../FullscreenLoader/FullscreenLoader";
import Lobby from "./Lobby";
import { useAssets } from "../AssetManager/hooks/useAssets";
import { AssetProvider } from "../AssetManager/context/AssetProvider";
import { useIndex } from "../AssetManager/hooks/useIndex";
//import { useInit } from "../AssetManager/context/AssetProvider";
import { CanvasCodeEditor } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import { useUnit } from "../CK_Adapter/CK_UnitProvider";

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


function CodeEditor() {

    const { initialized: initializedIndex, index } = useIndex();
    const [assetId, setAssetId] = useState<string | undefined>(undefined);
    const tController = useRef(new TextController())
    const { initialized: initializedAssets, assets } = useAssets(assetId ? [{
        assetId,
        assetController: tController.current,
    }] : []);

    const [vertexId, setVertexId] = useState<string | undefined>(undefined);

    const payloadRef = useRef<any>(null);
    useUnit(
        u => "VERTEX_PAYLOAD" in u.payload,
        (u,w) => {
            payloadRef.current = u.payload.VERTEX_PAYLOAD;
            w.thread("default").worker(u.sender, {
                VERTEX_PAYLOAD_response: true,
            })
            setVertexId(u.payload.VERTEX_PAYLOAD.vertexId);
            w.dispatch();
        }
    )

    console.log(index, initializedIndex, assets, initializedAssets, assetId, vertexId);
    const payload = payloadRef.current;
    useEffect(() => {
        if (payload && payload.assetMetadata !== undefined && initializedIndex) {
            const { name, type } = payload.assetMetadata;
            console.log(index.data);
            const assetId = Object.entries(index.data).find(([id, assetMetadata]) => {
                return assetMetadata.name === name && assetMetadata.type === type;
            })?.[0];
            setAssetId(assetId);
        }
    }, [payload, initializedIndex]);


    const initialized = initializedIndex && initializedAssets && vertexId !== undefined;
    if (!initialized) {
        return <FullscreenLoader />
    }
    if (assetId !== undefined && assets[assetId] !== undefined) {
        const asset = assets[assetId];
        ////console.log(asset.data) 
        return <div style={{
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            display: "grid",
            gridTemplateRows: "1fr",
        }}>
            {/* <ReturnBar 
                {...{
                    asset,
                    assetId,
                    setAssetId,
                    index,
                }}
            /> */}

            <div style={{
                width: "100vw",
                height: "calc(100vh)",
                overflow: "hidden",
            }}>
                <CanvasCodeEditor
                    setFunctionString={asset.update}
                    functionString={asset.data}
                />
            </div>
        </div>
        

    }
    return <Lobby
        {...{index,setAssetId,vertexId}}
    />


}


export default function Index() {
    return <AssetProvider>
        <CodeEditor /> 
    </AssetProvider>
}
