
import { useEffect, useRef } from "react";
import { useIndex } from "../AssetManager/hooks/useIndex";
import { useAssets } from "../AssetManager/hooks/useAssets";
import { TimelineController } from "@mtrifonov-design/pinsandcurves-external";

const Controller = TimelineController.TimelineController;


let subscriber : MessageEventSource | null = null;
let subscriberOrigin : string | undefined = undefined;


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
        subscriber?.postMessage({
            type: "timeline_relay_update",
            payload: {
                update,
            },
        }, { targetOrigin: subscriberOrigin } );

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

function useTimelineRelay() {

const {initialized: indexInitialized, index} = useIndex();

    const tController = useRef(new TController())
    const timelineAssets = indexInitialized ? Object.entries(index.data)
    .filter(([assetId, assetMetadata]) => assetMetadata.type === "timeline" && assetMetadata.name === "default.timeline")
    .map(([assetId, assetMetadata]) => ({ assetId, assetController: tController.current})) : [];
    const assetId = timelineAssets.length > 0 ? timelineAssets[0].assetId : undefined;

    const { initialized: assetsInitialized, assets } = useAssets(timelineAssets);
    //console.log(assets, assetId, assetsInitialized, timelineAssets);
    const initialized = 
    indexInitialized 
    && assetsInitialized
    && assetId !== undefined
    && assets[assetId] !== undefined;

    const timeline = initialized ? assets[assetId].data : undefined;
    globalThis.timeline = timeline;
    useEffect(() => {
        const listener = (message: MessageEvent) => {
            //console.log("Message received", message);
            const { data } = message;
            if (!data) return;
            const { type } = data;
            if (type === "timeline_relay_subscribe") {
                subscriber = message.source;
                subscriberOrigin = message.origin;
                subscriber?.postMessage({
                    type: "timeline_relay_subscribe_response",
                    payload: {
                        timeline: timeline?.serialize(),
                    },
                }, { targetOrigin: message.origin });
            }
        }
        
        window.addEventListener("message", listener);
        return () => {
            window.removeEventListener("message", listener);
        }
    }, [timeline]);
}

export default useTimelineRelay;