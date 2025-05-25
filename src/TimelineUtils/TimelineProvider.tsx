import React, { createContext, useRef, useEffect, useState } from 'react';
import { useAssets } from '../AssetManager/hooks/useAssets';
import { useIndex } from '../AssetManager/hooks/useIndex';
import { ProjectDataStructure, TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import CONFIG from '../Config';
import { useCK } from '../CK_Adapter/CK_Provider';
const pb = new ProjectDataStructure.ProjectBuilder();
pb.setTimelineData(900, 30, 0);
pb.addContinuousSignal('s1', 'Signal 1', [0, 1]);
pb.addPin('s1', 20, 0, 'return easyLinear()');
pb.addPin('s1', 40, 1, 'return easyEaseOut()');
pb.addPin('s1', 60, 0, 'return easyEaseIn()');
pb.setSignalActiveStatus('s1', true);
const makeFile = () => {
  const project = pb.getProject();
  const controller = TimelineController.TimelineController.fromProject(project);
  const serialised = controller.serialize();
  return serialised;
}

type Timeline = TimelineController.TimelineController;
const Controller = TimelineController.TimelineController;

class TController {
  initialised = false
  data: TimelineController.TimelineController;
  constructor() {
  }
  load(data: any) {
    //console.log("Loading data", data);
    this.data = new Controller(data);
    this.data.onPushUpdate(() => {
      // -> -> -> *** *** *** *** -> -> ->
      // continue here.
      const update = this.data.transferOutgoingEvent();
      this.update(update);
    });
    this.initialised = true;
  }
  receiveUpdate(update: any) {
    //console.log("Receiving update", update);
    this.data.receiveIncomingEvent(update);
  }
  receiveMetadataUpdate(update: any) { }
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
  update: (u: any) => void;
  updateMetadata: (m: any) => void;
  create: (c: any) => void;
  delete: (d: any) => void;
  subscribe: (s: any) => void;
  unsubscribe: (u: any) => void;
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
  defaultProject,
  defaultName,
  shouldCreate = false,
}: {
  children: React.ReactNode;
  defaultProject?: () => any;
  defaultName?: string;
  shouldCreate?: boolean;
}) {

  const { initialized: indexInitialized, index } = useIndex();

  const tController = useRef(new TController())
  const timelineAssets = indexInitialized ? Object.entries(index.data)
    .filter(([assetId, assetMetadata]) => assetMetadata.type === "timeline")
    .map(([assetId, assetMetadata]) => ({ assetId, assetController: tController.current })) : [];
  const assetId = timelineAssets.length > 0 ? timelineAssets[0].assetId : undefined;
  //console.log("Timeline assets", timelineAssets);

  const { FreeWorkload } = useCK();

  useEffect(() => {
    if (indexInitialized && (assetId === undefined) && shouldCreate) {
      const workload = FreeWorkload();
      workload.thread("default").worker({
        instance_id: "ASSET_SERVER",
        modality: "wasmjs",
        resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
      }, {
        createAsset: {
          asset: {
            data: defaultProject !== undefined ? defaultProject() : makeFile(),
            metadata: {
              type: "timeline",
              name: defaultName ? defaultName : "default.timeline",
              preferredEditorAddress: CONFIG.SELF_HOST + "editing",
            },
            on_update: {
              type: "custom",
              processor: {
                modality: "wasmjs",
                resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}TimelineProcessor`,
              }
            },
            id: defaultName ? defaultName : "default.timeline",
          },
        },
      });
      workload.dispatch();
    }
  }, [assetId, indexInitialized]);


  const { initialized: assetsInitialized, assets } = useAssets(timelineAssets);
  ////console.log(assets, assetId, assetsInitialized, timelineAssets);
  const initialized =
    indexInitialized
    && assetsInitialized
    && assetId !== undefined
    && assets[assetId] !== undefined;




  const timeline = initialized ? assets[assetId].data : undefined;

  //console.log(timeline);

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