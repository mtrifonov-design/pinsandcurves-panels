import { useReducer, useRef, useState } from "react";
import FullscreenLoader from "../FullscreenLoader/FullscreenLoader";
import { useUnit } from "../hooks";
import CONFIG from "../Config";
import Lobby from "./Lobby";
import SignalListContent from "./SignalListContent";
import { ProjectDataStructure, PinsAndCurvesProjectController, TimelineController } from "@mtrifonov-design/pinsandcurves-external";
import { useAssets } from "../AssetManager/hooks/useAssets";
import { AssetProvider } from "../AssetManager/context/AssetProvider";
import { useIndex } from "../AssetManager/hooks/useIndex";
import ReturnBar from "./ReturnBar";
const Controller = TimelineController.TimelineController;

class TController {
    initialised = false
    data : TimelineController.TimelineController;
    constructor() {}
    load(data : any) {
        this.data = new Controller(data);
        this.data.onPushUpdate(() => {
            const update = this.data.transferOutgoingEvent();
            this.update(update);
        });
        this.initialised = true;
    }
    receiveUpdate(update: any) {
        this.data.receiveIncomingEvent(update);
    }
    receiveMetadataUpdate(update: any) {}
    getSnapshot() {
        if (this.data !== undefined) {
            return this.data.getProject();
        } else {
            return undefined;
        }
    }
    destroy() {
        this.data = undefined;
        this.initialised = false;
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
    const tController = useRef(new TController())
    const { initialized: initializedAssets, assets } = useAssets(assetId ? [{
        assetId,
        assetController: tController.current,
    }] : []);
    const initialized = initializedIndex && initializedAssets;
    if (!initialized) {
        return <FullscreenLoader />
    }
    if (assetId !== undefined && assets[assetId] !== undefined) {
        const asset = assets[assetId];
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
            <SignalListContent
                {...{
                    asset,
                }}
            />
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
