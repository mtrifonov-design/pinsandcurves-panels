import React, { createContext, useRef, useState } from 'react';
import { useAssets } from '../AssetManager/hooks/useAssets';
import { useIndex } from '../AssetManager/hooks/useIndex';
import { TimelineController } from "@mtrifonov-design/pinsandcurves-external";

type Timeline = TimelineController.TimelineController;
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

const TimelineContext = createContext<Timeline | null>(null);

function TimelineProvider({
  children,
}: {
  children: React.ReactNode;
}) {

    const {initialized: indexInitialized, index} = useIndex();

    const tController = useRef(new TController())
    const timelineAssets = indexInitialized ? Object.entries(index.data)
    .filter(([assetId, assetMetadata]) => assetMetadata.type === "timeline" && assetMetadata.name === "default.timeline")
    .map(([assetId, assetMetadata]) => ({ assetId, assetController: tController.current})) : [];
    const assetId = timelineAssets.length > 0 ? timelineAssets[0].assetId : undefined;


    const { initialized: assetsInitialized, assets } = useAssets(timelineAssets);
    console.log(assets, assetId, assetsInitialized, timelineAssets);
    const initialized = 
    indexInitialized 
    && assetsInitialized
    && assetId !== undefined
    && assets[assetId] !== undefined;



    const timeline = initialized ? assets[assetId].data : undefined;

  return (
    <TimelineContext.Provider value={timeline}>
      {children}
    </TimelineContext.Provider>
  );
}

function useTimeline() {
  const context = React.useContext(TimelineContext);
  return context as Timeline | undefined;
}

export default TimelineProvider;
export { useTimeline };