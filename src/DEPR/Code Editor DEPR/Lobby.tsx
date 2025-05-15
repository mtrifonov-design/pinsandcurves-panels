
import CONFIG from "../Config";

function Lobby(p: {
    index: any;
    handleOpen: (assetId: string) => void;
}) {

    const files = Object.entries(p.index.data).filter(([id,file]: any) => file.type === "js");


  return (
    <div className="lobby">
      <h1>Welcome to the Code Editor Lobby</h1>
      <p>Select a file to edit or create a new one.</p>
      <button onClick={() => {
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
                                data: "Hello world",
                                metadata: { type: "js", name: "text.p5js" },
                                on_update: {
                                    type: "simple"
                                }
                            },
                        },
                    },
                }],
            });
        }}>Create file</button>

      <div>
        {files.map(([id, file]: any) => {
            return (<div key={id}
                style={{
                    textDecoration: "underline",
                    cursor: "pointer",
                    color: "blue",
                    margin: "5px",
                }}
                onClick={() => {
                    p.handleOpen(id);
                }}
            >{file.name}</div>)
        })}
      </div>
    </div>
  );
}

export default Lobby;