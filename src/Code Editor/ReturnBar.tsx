
import React, { useSyncExternalStore } from "react";
import CONFIG from "../Config";

function ReturnBar(p: {
    asset: any;
    index: any;
    setAssetId: (s:string) => void;
    assetId?: string;
}) {
    const { index, assetId, asset, setAssetId } = p;

    const updateFileName = (newName: string) => {

        // asset.data.update() {}

        // Existing metadata
        asset.updateMetadata({
            name: newName,
            type: index.data[assetId].type,})
    }

    const [fileName, setFileName] = React.useState(index.data[assetId].name);

    return (
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
                <button onClick={() => {setAssetId(undefined)}}>Close</button>
            </div>
    );
}
export default ReturnBar;