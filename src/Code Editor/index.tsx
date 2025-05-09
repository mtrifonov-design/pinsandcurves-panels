import { useEffect, useReducer, useRef, useState } from "react";
import FullscreenLoader from "../FullscreenLoader/FullscreenLoader";
import { useUnit } from "../hooks";
import CONFIG from "../Config";
import Lobby from "./Lobby";
import { useAssets } from "../AssetManager/hooks/useAssets";
import { AssetProvider } from "../AssetManager/context/AssetProvider";
import { useIndex } from "../AssetManager/hooks/useIndex";
import ReturnBar from "./ReturnBar";
import { useInit } from "../AssetManager/context/AssetProvider";
import { CanvasCodeEditor } from "@mtrifonov-design/pinsandcurves-specialuicomponents";

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

    // useUnit((unit) => {
    //     const { payload } = unit;
    //     const { INIT, payload : p } = payload;
    //     if (INIT && p && p.assetId !== undefined) {
    //         setAssetId(assetId);
    //     }
    // })


    const payload = useInit();
    useEffect(() => {
        if (payload && payload.assetId !== undefined) {
            setAssetId(payload.assetId);
        }
    }, [payload]);



    const initialized = initializedIndex && initializedAssets;
    if (!initialized) {
        return <FullscreenLoader />
    }
    if (assetId !== undefined && assets[assetId] !== undefined) {
        const asset = assets[assetId];
        //console.log(asset.data) 
        return <div style={{
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            display: "grid",
            gridTemplateRows: "50px 1fr",
        }}>
            <ReturnBar 
                {...{
                    asset,
                    assetId,
                    setAssetId,
                    index,
                }}
            />

            <div style={{
                width: "100vw",
                height: "calc(100vh - 50px)",
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
        {...{index,setAssetId}}
    />


}


export default function Index() {
    return <AssetProvider>
        <CodeEditor /> 
    </AssetProvider>
}
