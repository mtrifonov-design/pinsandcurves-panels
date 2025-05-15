import React from "react";
import { CanvasCodeEditor } from "@mtrifonov-design/pinsandcurves-specialuicomponents";
import CONFIG from "../Config";

function CodeEditorContent(p: {
    file: any;
    index: any;
    handleCloseFile: () => void;
}) {
    const { file, index, handleCloseFile } = p;

    const updateFile = (newFile: any) => {
        globalThis.CK_ADAPTER.pushWorkload({
            default: [
                {
                    type: "worker",
                    receiver: {
                        instance_id: "ASSET_SERVER",
                        modality: "wasmjs",
                        resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
                    },
                    payload: {
                        updateAsset: {
                            asset_id: file.assetId,
                            subscription_id: file.id,
                            update: newFile,
                        },
                    },
                },
            ],
        });
    }

    const updateFileName = (newName: string) => {
        globalThis.CK_ADAPTER.pushWorkload({
            default: [
                {
                    type: "worker",
                    receiver: {
                        instance_id: "ASSET_SERVER",
                        modality: "wasmjs",
                        resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
                    },
                    payload: {
                        updateAssetMetadata: {
                            asset_id: file.assetId,
                            subscription_id: file.id,
                            metadata: { 
                                type: "js",
                                name: newName 
                            },
                        },
                    },
                },
            ],
        });
    }

    const [fileName, setFileName] = React.useState(index.data[file.assetId].name);


    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            display: "grid",
            gridTemplateRows: "50px 1fr",
        }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
                backgroundColor: "#f0f0f0",
                borderBottom: "1px solid #ccc",
            }}>
                <input
                    type="text"
                    value={fileName}
                    onChange={(e) => {
                        setFileName(e.target.value);
                    }}
                    onBlur={(e) => {
                        updateFileName(fileName);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            updateFileName(fileName);
                        }
                    }}
                    ></input>
                <button onClick={handleCloseFile}>Close</button>
            </div>
            <CanvasCodeEditor
                setFunctionString={updateFile}
                functionString={file.data}
            />
        </div>
    );
}

export default CodeEditorContent;