
import React, { useSyncExternalStore } from "react";
import CONFIG from "../Config";
import { Icon, SimpleCommittedTextInput } from "@mtrifonov-design/pinsandcurves-design";

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
                backgroundColor: "var(--gray3)",
            }}>
                <SimpleCommittedTextInput
                    initialValue={fileName}
                    onCommit={updateFileName}
                    bgColor={"var(--gray4)"}
                    bgActive={"var(--gray2)"}
 
                />
                {/* <Icon
                    iconName="close"
                    onClick={() => {
                        setAssetId(undefined);
                    }}
                
                /> */}
                {/* <input
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
                    ></input> */}
                {/* <button onClick={() => {setAssetId(undefined)}}>Close</button>
             */}
            </div>
    );
}
export default ReturnBar;