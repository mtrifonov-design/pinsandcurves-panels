import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { AssetProvider } from "../../AssetManager/context/AssetProvider";
import FullscreenLoader from "../FullscreenLoader/FullscreenLoader";
import { JSONAssetCreator, useJSONAssets } from "../JSONAsset/Provider";
import TimelineProvider, { useTimeline } from "../TimelineUtils/TimelineProvider";

const InteriorContext = createContext<{
    graphics: any;
    controls: any;
    local: any;
    composition: any;
    timeline: any;
    index: any;
    updateGraphics: (newGraphics: any) => void;
    updateControls: (newControls: any) => void;
    updateLocal: (newLocal: any) => void;
    updateComposition: (newComposition: any) => void;
}>(null);

function Interior({ controls, graphics, local, composition, timeline, index, children } : {
    controls: any;
    graphics: any;
    local: any;
    composition: any;
    timeline: any;
    index: any;
    children: React.ReactNode;
}) {
    const [graphicsState, setGraphicsState] = useState<string>("start");

    // const graphicsSnapshot = useSyncExternalStore(
    //     graphics.subscribeInternal.bind(graphics),
    //     graphics.getSnapshot.bind(graphics)
    // );
    // const controlsSnapshot = useSyncExternalStore(
    //     controls.subscribeInternal.bind(controls),
    //     controls.getSnapshot.bind(controls)
    // );
    // const localSnapshot = useSyncExternalStore(
    //     local.subscribeInternal.bind(local),
    //     local.getSnapshot.bind(local)
    // );
    const graphicsSnapshot = graphics.getSnapshot();
    const controlsSnapshot = controls.getSnapshot();
    const localSnapshot = local.getSnapshot();
    const compositionSnapshot = composition.getSnapshot();
    const indexSnapshot = index.getSnapshot();

    const updateGraphics = (newGraphics: any) => {
        setGraphicsState(newGraphics);
        graphics.setData({sourceId: graphicsState, source: newGraphics});
        controls.setData({sourceId: graphicsState, renderState: controlsSnapshot});
    }
    const updateControls = (newControls: any) => {
        controls.setData({sourceId: graphicsState, renderState: newControls});
    }
    const updateLocal = (newLocal: any) => {
        local.setData(newLocal);
    }
    const updateComposition = (newComposition: any) => {
        composition.setData(newComposition);
    }

    return <InteriorContext.Provider value={{
        graphics: graphicsSnapshot,
        controls: controlsSnapshot,
        local: localSnapshot,
        timeline,
        index: indexSnapshot,
        composition: compositionSnapshot,
        updateComposition,
        updateGraphics,
        updateControls,
        updateLocal
    }}>
        {children}
    </InteriorContext.Provider>
}

function Exterior({children, effectInstanceName}: {children?: React.ReactNode, effectInstanceName: string}) {
  const { initialized, index, assets: jsonAssets} = useJSONAssets((id: string, metadata: any) => {
    if (id === `${effectInstanceName}.controls` && metadata.type === "controls") {
      return true;
    }
    if (id === `${effectInstanceName}.graphics` && metadata.type === "graphics") {
      return true;
    }
    if (id === `${effectInstanceName}.local` && metadata.type === "local") {
      return true;
    }
        if (id === `default.composition` && metadata.type === "composition") {
      return true;
    }
    return false;
  });

  const timeline = useTimeline();
  const ready = initialized 
  && jsonAssets[`${effectInstanceName}.controls`]
  && jsonAssets[`${effectInstanceName}.graphics`]
  && jsonAssets[`${effectInstanceName}.local`]
  && jsonAssets[`default.composition`]
  && timeline;
  //console.log(JSON.stringify(jsonAssets[`${effectInstanceName}.local`], null, 2));
  if (!ready) {
    return <FullscreenLoader />
  }
  return <Interior 
    controls={jsonAssets[`${effectInstanceName}.controls`].data} 
    graphics={jsonAssets[`${effectInstanceName}.graphics`].data}
    local={jsonAssets[`${effectInstanceName}.local`].data}
    composition={jsonAssets[`default.composition`].data}
    timeline={timeline}
    index={index}
  >
    {children}
  </Interior>;
}

function useEffectFoundation() {
    const context = useContext(InteriorContext);
    if (!context) {
        throw new Error("useEffectFoundation must be used within an EffectFoundation");
    }
    return context;
}

export { useEffectFoundation };

export default function EffectFoundation({
    children,
    defaultControls,
    defaultGraphics,
    defaultLocal,
    effectInstanceName
}: {
    children?: React.ReactNode,
    defaultControls: any,
    defaultGraphics: any,
    defaultLocal: any,
    effectInstanceName: string
}) {

    return <AssetProvider>
        <JSONAssetCreator
            defaultName="default.composition"
            defaultData={{
                canvasDimensions: [1920, 1080],
                layers: [
                    {
                        effects: [
                            {
                                instanceId: "Something"
                            }
                        ]
                    }
                ]

            }}
            defaultType="composition"
        >
            <JSONAssetCreator
                defaultName={`${effectInstanceName}.controls`}
                defaultData={{
                    sourceId: "start",
                    renderState: defaultControls
                }}
                defaultType="controls"
            >
            <JSONAssetCreator
                defaultName={`${effectInstanceName}.local`}
                defaultData={defaultLocal}
                defaultType="local"
            >
                <JSONAssetCreator
                    defaultName={`${effectInstanceName}.graphics`}
                    defaultData={{
                        sourceId: "start",
                        source: defaultGraphics
                    }}
                    defaultType='graphics'
                >
                    <TimelineProvider
                        defaultName={"default.timeline"}
                    >
                        <Exterior
                            effectInstanceName={effectInstanceName}
                        >
                            {children}
                        </Exterior>
                    </TimelineProvider>
                </JSONAssetCreator>
            </JSONAssetCreator>
            </JSONAssetCreator>
        </JSONAssetCreator>
    </AssetProvider>;
}