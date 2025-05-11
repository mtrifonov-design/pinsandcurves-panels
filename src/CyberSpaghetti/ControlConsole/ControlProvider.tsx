import React, { createContext, useRef, useEffect, useState } from 'react';
import { useAssets } from '../../AssetManager/hooks/useAssets';
import { useIndex } from '../../AssetManager/hooks/useIndex';
import Controller, { Controls } from '../CyberSpaghettiControls';
import CONFIG from '../../Config';


const ControlsContext = createContext<Controls | null>(null);

function ControlsProvider({
    children,
}: {
    children: React.ReactNode;
}) {

    const { initialized: indexInitialized, index } = useIndex();

    const tController = useRef(new Controller())
    const timelineAssets = indexInitialized ? Object.entries(index.data)
        .filter(([assetId, assetMetadata]) => assetMetadata.type === "controls" && assetMetadata.name === "cyberspaghetti.controls")
        .map(([assetId, assetMetadata]) => ({ assetId, assetController: tController.current })) : [];
    const assetId = timelineAssets.length > 0 ? timelineAssets[0].assetId : undefined;

    useEffect(() => {
        if (indexInitialized && (assetId === undefined)) {
            globalThis.CK_ADAPTER.pushWorkload({
                default: [{
                    type: "worker",
                    receiver: {
                        instance_id: "ASSET_SERVER",
                        modality: "wasmjs",
                        resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
                    },
                    payload: {
                        createAsset: {
                            asset: {
                                data: Controls.defaultControls,
                                metadata: {
                                    type: "controls",
                                    name: "cyberspaghetti.controls",
                                    preferredEditorAddress: CONFIG.SELF_HOST + "cyberspaghetti-controlconsole",
                                },
                                on_update: {
                                    type: "simple",
                                }
                            },
                        },
                    },
                }],
            });
        }
    }, [assetId, indexInitialized]);


    const { initialized: assetsInitialized, assets } = useAssets(timelineAssets);
    //console.log(assets, assetId, assetsInitialized, timelineAssets);
    const initialized =
        indexInitialized
        && assetsInitialized
        && assetId !== undefined
        && assets[assetId] !== undefined;

    const controls = initialized ? assets[assetId].data : undefined;

    return (
        <ControlsContext.Provider value={controls}>
            {children}
        </ControlsContext.Provider>
    );
}

function useControls() {
    const context = React.useContext(ControlsContext);
    return context as Controls | undefined;
}

export default ControlsProvider;
export { useControls };