
import CONFIG from "../Config";
import { ProjectDataStructure, TimelineController } from '@mtrifonov-design/pinsandcurves-external';

const pb = new ProjectDataStructure.ProjectBuilder();
pb.setTimelineData(900,30,0);
pb.addContinuousSignal('s1', 'Signal 1', [0, 1]);
pb.addPin('s1', 20, 0, 'return easyLinear()');
pb.addPin('s1', 40, 1, 'return easyEaseOut()');
pb.addPin('s1', 60, 0, 'return easyEaseIn()');
pb.setSignalActiveStatus('s1', true);

function Lobby(p: {
    index: any;
    setAssetId: (assetId: string) => void;
}) {
    const files = Object.entries(p.index.data).filter(([id,file]: any) => file.type === "js" || file.type === "html");
    const makeFile = () => {
        return "test";
    }
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
                                data: `console.log("Hello World")`,
                                metadata: { type: "js", name: "test.js",
                                    preferredEditorAddress: CONFIG.SELF_HOST+"code",
                                 },
                                on_update: {
                                    type: "simple",
                                }
                            },
                        },
                    },
                }],
            });
        }}>Create js file</button>
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
                                data: `
                                    <html>
                                        <head>
                                            <title>Test</title>
                                        </head>
                                        <body>
                                            <h1>Hello World</h1>
                                            <script src="{{test.js}}"></script>
                                        </body>
                                    </html>
                                `,
                                metadata: { type: "html", name: "index.html",
                                    preferredEditorAddress: CONFIG.SELF_HOST+"htmlpreview",
                                 },
                                on_update: {
                                    type: "simple",
                                }
                            },
                        },
                    },
                }],
            });
        }}>Create html file</button>
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
                    p.setAssetId(id);
                }}
            >{file.name}</div>)
        })}
      </div>
    </div>
  );
}

export default Lobby;