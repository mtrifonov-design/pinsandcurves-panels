import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCK } from "../../CK_Adapter/CK_Provider";
import CONFIG from "../../Config";
import { useIndex } from "../../AssetManager/hooks/useIndex";
import { useAssets } from "../../AssetManager/hooks/useAssets";

class Controller {
    initialised = false
    data?: string;
    constructor() {}
    load(data: string) {
        this.data = data;
        this.initialised = true;
    }
    receiveUpdate(update: string) {
        this.data = update;
    }
    receiveMetadataUpdate() {}
    getSnapshot() {
        return this.data;
    }
    destroy() {
        this.data = undefined;
        this.initialised = false;
    }
    update: (u: any) => void;
    updateMetadata: (m: any) => void;
    setHooks(hooks) {
        this.update = hooks.update;
        this.updateMetadata = hooks.updateMetadata;
    }
}


export interface ImageUploaderProps {
    selectedImage?: string;
    images: string[];
    updateState: (state: { shapeImageAssetId?: string; shapeImageAssetIds?: string[] }) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
    selectedImage,
    updateState,
    images,
}) => {

    const { initialized, index } = useIndex();

    const assetsList = images
    .filter(id => initialized && Object.keys(index.data).includes(id))
    .map(id => ({
        assetId: id,
        assetController: new Controller(),
    }))
    const { initialized: assetsInitialized, assets } = useAssets(assetsList);

    const fileInput = useRef<HTMLInputElement>(null);

    const { FreeWorkload } = useCK();
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAssetId = crypto.randomUUID();
        updateState({ shapeImageAssetId: newAssetId, shapeImageAssetIds: [...images, newAssetId] });
        
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            // Do something with the file, e.g., upload it
            // convert to data url
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const workload = FreeWorkload();
                workload.thread("default").worker({
                    instance_id: "ASSET_SERVER",
                    modality: "wasmjs",
                    resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
                }, {
                    createAsset: {
                    asset: {
                        data: dataUrl,
                        metadata: {
                        type: "image",
                        name: newAssetId + ".image",
                        preferredEditorAddress: CONFIG.SELF_HOST + "image-viewer",
                        },
                        on_update: {
                        type: "simple",
                        },
                        id: newAssetId,
                    },
                    },
                });
                workload.dispatch();
            }
            reader.readAsDataURL(file);
        }
    }


    return (
        <div style={{
            border: "2px solid var(--gray3)",
            borderRadius: "var(--borderRadiusSmall)",
            padding: "10px",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "10px",
        }}>
            {images.map((img, index) => (
                <div key={index} style={{ 
                    width: "80px",
                    height: "80px",
                    border: `2px solid ${img === selectedImage ? 'var(--gray6)' : 'var(--gray3)'}`,
                    borderRadius: "var(--borderRadiusSmall)",
                }}
                onClick={() => updateState({ shapeImageAssetId: img })}
                >
                    {
                        assetsInitialized && assets[img] ? (
                            <img
                                src={assets[img].data}
                                alt={`Image ${index}`}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "var(--borderRadiusSmall)",
                                }}
                            />
                        ) : (
                            <div style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                Loading...
                            </div>
                        )
                    
                    }
                </div>
            ))}
            <input
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                ref={fileInput}
                style={{
                    display: "none",
                }}
            />
            <div style={{
                width: "80px",
                height: "80px",
                border: "2px dashed var(--gray3)",
                borderRadius: "var(--borderRadiusSmall)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                }}
                onClick={() => {
                    if (fileInput.current) {
                        fileInput.current.click();
                    }
                }}
            >+</div>
        </div>
    );
};

export default ImageUploader;
