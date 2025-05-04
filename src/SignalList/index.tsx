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
const Controller = TimelineController.TimelineController;

class TController {
    initialised = false
    data : TimelineController.TimelineController;
    constructor() {}
    load(data : any) {
        this.data = new Controller(data);
        this.initialised = true;
    }
    receiveUpdate(update: any) {
        this.data.receiveIncomingEvent(update);
    }
    getSnapshot() {
        return this.data.getProject();
    }
    update : (u: any) => void;
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
    }
}


function CodeEditor() {

    const { initialized, index } = useIndex();

    const [assetId, setAssetId] = useState(undefined);
    const tController = useRef(new TController())

    const asset = {
        assetId,
        assetController: tController.current,
    }

    const assetList = assetId ? [asset] : [];

    const { initialized: initializedAssets, assets } = useAssets(assetList);

    const assetValues = assets ? Object.values(assets) : [];


    if (!initialized) {
        return <FullscreenLoader />
    }

    const handleOpen = (assetId: string) => {
        setAssetId(assetId);
    }

    if (assetValues.length > 0) {
        const asset = assetValues[0];
        return <SignalListContent
            {...{
                file:asset,
                index,
                handleOpen,
            }}
        />
    }

    return <Lobby
        {...{index,handleOpen}}
    />
}


export default function Index() {

    return <AssetProvider>
        <CodeEditor /> 
    </AssetProvider>


}
