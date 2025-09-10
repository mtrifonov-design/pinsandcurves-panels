import React, { createContext, useRef, useEffect, useContext } from 'react';
import { useAssets } from '../../AssetManager/hooks/useAssets';
import { useIndex } from '../../AssetManager/hooks/useIndex';
import Controller, { JSONAsset } from '.';
import CONFIG from '../../Config';
import { useCK } from '../../CK_Adapter/CK_Provider';


const ControlsContext = createContext<{ [key: string]: JSONAsset } | null>(null);


function JSONAssetCreator({
    children,
    defaultName = "untitled",
    defaultData = {},
    defaultType = "default",
    preferredEditorAddress = "",
}: {
    children: React.ReactNode;
    defaultName: string;
    defaultData: any;
    defaultType: string;
    preferredEditorAddress?: string;
}) {
    const { initialized: indexInitialized, index } = useIndex();
    const { FreeWorkload } = useCK();

    useEffect(() => {
        if (indexInitialized) {
            const asset = Object.entries(index.data).find(([assetId, assetMetadata]) => assetMetadata.type === defaultType && assetMetadata.name === defaultName);
            if (asset !== undefined) {
                return;
            }
            const workload = FreeWorkload();
            workload.thread("default").worker({
                instance_id: "ASSET_SERVER",
                modality: "wasmjs",
                resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
            }, {
                createAsset: {
                    asset: {
                        data: defaultData,
                        metadata: {
                            type: defaultType,
                            name: defaultName,
                            preferredEditorAddress: CONFIG.SELF_HOST + preferredEditorAddress,
                        },
                        on_update: {
                            type: "simple",
                        },
                        id: defaultName,
                    },
                },
            });
            workload.dispatch();
        }
    }, [indexInitialized, index, FreeWorkload, defaultName, defaultData, defaultType, preferredEditorAddress]);

    return <>{children}</>;
};

// function JSONAssetProvider({
//     children,
//     shouldCreate = false,
//     defaultName = "untitled",
//     defaultData = {},
//     preferredEditorAddress = "",
// }: {
//     children: React.ReactNode;
//     shouldCreate?: boolean;
//     defaultName: string;
//     defaultData?: any;
//     preferredEditorAddress?: string;
// }) {

//     const { initialized: indexInitialized, index } = useIndex();

//     const tController = useRef(new Controller())
//     const timelineAssets = indexInitialized ? Object.entries(index.data)
//         .filter(([assetId, assetMetadata]) => assetMetadata.type === "controls" && assetMetadata.name === defaultName)
//         .map(([assetId, assetMetadata]) => ({ assetId, assetController: tController.current })) : [];
//     const assetId = timelineAssets.length > 0 ? timelineAssets[0].assetId : undefined;

//     const { FreeWorkload } = useCK();

//     useEffect(() => {
//         if (indexInitialized && (assetId === undefined) && shouldCreate) {
//             const workload = FreeWorkload();
//             workload.thread("default").worker({
//                 instance_id: "ASSET_SERVER",
//                 modality: "wasmjs",
//                 resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
//             }, {
//                 createAsset: {
//                     asset: {
//                         data: defaultData,
//                         metadata: {
//                             type: "controls",
//                             name: defaultName,
//                             preferredEditorAddress: CONFIG.SELF_HOST + preferredEditorAddress,
//                         },
//                         on_update: {
//                             type: "simple",
//                         },
//                         id: defaultName,
//                     },
//                 },
//             });
//             workload.dispatch();
//         }
//     }, [indexInitialized, assetId, FreeWorkload]);


//     const { initialized: assetsInitialized, assets } = useAssets(timelineAssets);
//     //console.log(assets, assetId, assetsInitialized, timelineAssets);
//     const initialized =
//         indexInitialized
//         && assetsInitialized
//         && assetId !== undefined
//         && assets[assetId] !== undefined;

//     const controls = initialized ? assets[assetId].data : undefined;

//     return (
//         <ControlsContext.Provider value={{ [defaultName]: controls, ...useContext(ControlsContext) }}>
//             {children}
//         </ControlsContext.Provider>
//     );
// }

// function useJSONAssets() {
//     const context = React.useContext(ControlsContext);
//     return context as {[key: string]: JSONAsset} | undefined;
// }

function useJSONAssets(
    assetFilter: (id: string, metadata: any) => boolean) {
    const { initialized: indexInitialized, index } = useIndex();
    const registeredAssets = indexInitialized ? Object.entries(index.data)
        .filter(([id, metadata]) => assetFilter(id, metadata))
        .map(([assetId]) => ({ assetId, assetController: new Controller() })) : [];
    return {...useAssets(registeredAssets), index};
}

//export default JSONAssetProvider;
export { useJSONAssets, JSONAssetCreator };