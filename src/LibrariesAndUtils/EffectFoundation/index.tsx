import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { AssetProvider } from "../../AssetManager/context/AssetProvider";
import FullscreenLoader from "../FullscreenLoader/FullscreenLoader";
import { JSONAssetCreator, useJSONAssets } from "../JSONAsset/Provider";
import TimelineProvider from "../TimelineUtils/TimelineProvider";

const InteriorContext = createContext<{
    graphics: any;
    controls: any;
    local: any;
    updateGraphics: (newGraphics: any) => void;
    updateControls: (newControls: any) => void;
    updateLocal: (newLocal: any) => void;
}>(null);

function Interior({ controls, graphics, local, children } : {
    controls: any;
    graphics: any;
    local: any;
    children: React.ReactNode;
}) {
    const [graphicsState, setGraphicsState] = useState<string>("start");

    const graphicsSnapshot = useSyncExternalStore(
        graphics.subscribeInternal.bind(graphics),
        graphics.getSnapshot.bind(graphics)
    );
    const controlsSnapshot = useSyncExternalStore(
        controls.subscribeInternal.bind(controls),
        controls.getSnapshot.bind(controls)
    );
    const localSnapshot = useSyncExternalStore(
        local.subscribeInternal.bind(local),
        local.getSnapshot.bind(local)
    );
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
    return <InteriorContext.Provider value={{
        graphics: graphicsSnapshot,
        controls: controlsSnapshot,
        local: localSnapshot,
        updateGraphics,
        updateControls,
        updateLocal
    }}>
        {children}
    </InteriorContext.Provider>
}

function Exterior({children}: {children?: React.ReactNode}) {
  const { initialized, assets: jsonAssets} = useJSONAssets((id: string, metadata: any) => {
    if (id === "default.controls" && metadata.type === "controls") {
      return true;
    }
    if (id === "default.graphics" && metadata.type === "graphics") {
      return true;
    }
    if (id === "default.local" && metadata.type === "local") {
      return true;
    }
    return false;
  });
  const ready = initialized 
  && jsonAssets["default.controls"]
  && jsonAssets["default.graphics"]
  && jsonAssets["default.local"];
  console.log(jsonAssets)
  if (!ready) {
    return <FullscreenLoader />
  }
  return <Interior 
    controls={jsonAssets["default.controls"].data} 
    graphics={jsonAssets["default.graphics"].data}
    local={jsonAssets["default.local"].data}
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
                        <Exterior>
                            {children}
                        </Exterior>
                    </TimelineProvider>
                </JSONAssetCreator>
            </JSONAssetCreator>
            </JSONAssetCreator>
        </JSONAssetCreator>
    </AssetProvider>;
}