import { JSONAssetCreator, useJSONAssets } from "../../LibrariesAndUtils/JSONAsset/Provider";
import { AssetProvider } from "../../AssetManager/context/AssetProvider";
import { defaultCompositionData, defaultTimelineData, defaultLocalData } from "./datastructures";
import { useEffect, useState } from "react";
import FullscreenLoader from "../../LibrariesAndUtils/FullscreenLoader/FullscreenLoader";
import TimelineLeftSide from "./Left";
import TimelineRightSide from "./Right";


function Interior({ state, updateState } : { state: any; updateState: (entry: any) => void }) {
    return <div style={{
        display: "grid",
        gridTemplateColumns: "400px 1fr",
        height: "100vh",
        width: "100vw"
    }}>
        <TimelineLeftSide state={state} updateState={updateState} />
        <TimelineRightSide state={state} updateState={updateState} />
    </div>
}


function useAtomicState(state: { local: any; setLocal: any; timeline: any; composition: any }) {
    const local = state.local;
    const timeline = state.timeline.data.getSnapshot();
    const composition = state.composition.data.getSnapshot();

    const updateAtomicState = (entry: any) => {
        const stamp = Date.now();
        const newLocal = entry.local || local.data;
        const newComposition = entry.composition || composition.data;
        const newTimeline = entry.timeline || timeline.data;
        state.setLocal({ data: newLocal.data, epoch: stamp });
        state.timeline.data.setData({ data: newTimeline.data, epoch: stamp });
        state.composition.data.setData({ data: newComposition.data, epoch: stamp });
    }

    const [atomicState, setAtomicState] = useState({state: {local,timeline,composition},epoch:0});

    useEffect(() => {
        if (
            composition.epoch === timeline.epoch
            && local.epoch === timeline.epoch
            && local.epoch >= atomicState.epoch
        ) {
            setAtomicState({
                state: {local,timeline,composition},
                epoch: timeline.epoch
            });
        }
    }, [
        state.local, state.timeline, state.composition, atomicState.epoch
    ])

    return [atomicState.state, updateAtomicState];
};

function AtomicStateWrapper({local, setLocal, timeline, composition} : { local: any; setLocal: any; timeline: any; composition: any }) {
  const [atomicState,updateAtomicState] = useAtomicState({
    local: local,
    setLocal: setLocal,
    timeline: timeline,
    composition: composition
  })
    return <Interior 
    state={atomicState}
    updateState={updateAtomicState}
  />
}


function Exterior({ local, setLocal, children } : { local: any; setLocal: any; children: React.ReactNode }) {
  const { initialized, index, assets: jsonAssets} = useJSONAssets((id: string, metadata: any) => {
    if (id === `default.timeline` && metadata.type === "timeline") {
      return true;
    }
    if (id === `default.composition` && metadata.type === "composition") {
      return true;
    }
    return false;
  });

  const ready = initialized 
  && jsonAssets[`default.timeline`]
  && jsonAssets[`default.composition`]

  if (!ready) {
    return <FullscreenLoader />
  }
  return <AtomicStateWrapper 
    local={local}
    setLocal={setLocal}
    timeline={jsonAssets[`default.timeline`]}
    composition={jsonAssets[`default.composition`]}
  />
}

function Timeline() {

    const [localState, setLocalState] = useState<any>(defaultLocalData);

    return <AssetProvider>
        <JSONAssetCreator
            defaultName="default.composition"
            defaultData={defaultCompositionData}
            defaultType="composition"
        >
            <JSONAssetCreator
                defaultName={`default.timeline`}
                defaultData={defaultTimelineData}
                defaultType="timeline"
            >
                <Exterior local={localState} setLocal={setLocalState} />
            </JSONAssetCreator>
        </JSONAssetCreator>
    </AssetProvider>;
}

export default Timeline;