
import { Button, Logo } from "@mtrifonov-design/pinsandcurves-design";
import CONFIG from "../Config";
import { ProjectDataStructure, TimelineController } from '@mtrifonov-design/pinsandcurves-external';
import { useCK } from "../CK_Adapter/CK_Provider";

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
    vertexId: string | undefined;
}) {
    const { FreeWorkload } = useCK();
    const files = Object.entries(p.index.data).filter(([id,file]: any) => file.type === "js" || file.type === "html");
  return (
    <div style={{
        backgroundColor: "var(--gray1)",
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    }}>

        <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "38px",
            marginTop: "30px",
            color: "var(--gray3)",
            gap: "10px",
        }}>
            <Logo color="var(--gray3)" 
                style={{
                    width: "37px",
                    height: "37px",
                }}
            />
        Code Editor

      </div>

      {/* <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "30px",
        color: "var(--gray6)",
      }}>
        Open existing assets
        <div>
        {files.map(([id, file]: any) => {
            return (
            <Button 
                key={id}
                text={file.name}
                onClick={() => p.setAssetId(id)}
            />)
        })}
      </div>
      </div> */}
      
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "30px",
        color: "var(--gray6)",
      }}>
        Create new asset
        <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "10px",
        }}>
            <Button 
                text="javascript"
                iconName="javascript"
                onClick={() => {
                    const w = FreeWorkload();
                    w.thread("default").worker({
                        instance_id: "ASSET_SERVER",
                        modality: "wasmjs",
                        resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
                    }, {
                        createAsset: {
                            asset: {
                                data: `//console.log("Hello World")`,
                                metadata: { type: "js", name: "test.js",
                                    preferredEditorAddress: CONFIG.SELF_HOST+"code",
                                 },
                                on_update: {
                                    type: "simple",
                                },
                                id: "test.js",
                            },

                        },
                        
                    });
                    w.thread("ui").worker({
                        instance_id: "ui",
                        modality: "ui",
                        resource_id: `ui`,
                    }, {
                        setVertexPayload: {
                            vertexId: p.vertexId,
                            payload: {
                                assetMetadata: { type: "js", name: "test.js",
                                    preferredEditorAddress: CONFIG.SELF_HOST+"code",
                                 },
                            }
                        }
                    });
                    w.dispatch();
                }}                    
            />
            <Button 
                text="html"
                iconName="html"
                onClick={() => {
                    const w = FreeWorkload();
                    w.thread("default").worker({
                        instance_id: "ASSET_SERVER",
                        modality: "wasmjs",
                        resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
                    }, {
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
                                            preferredEditorAddress: CONFIG.SELF_HOST+"code",
                                         },
                                on_update: {
                                    type: "simple",
                                },
                                id: "index.html",
                            },
                        },
                    });
                    w.thread("ui").worker({
                        instance_id: "ui",
                        modality: "ui",
                        resource_id: `ui`,
                    }, {
                        setVertexPayload: {
                            vertexId: p.vertexId,
                            payload: {
                                assetMetadata: { type: "html", name: "index.html",
                                    preferredEditorAddress: CONFIG.SELF_HOST+"code",
                                 },
                            }
                        }
                    });
                    w.dispatch();
                    // globalThis.CK_ADAPTER.pushWorkload({
                    //     default: [{
                    //         type: "worker",
                    //         receiver: {
                    //             instance_id: "ASSET_SERVER",
                    //             modality: "wasmjs",
                    //             resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
                    //         },
                    //         payload: {
                    //             createAsset: {
                    //                 asset: {
                    //                     data: `
                    //                         <html>
                    //                             <head>
                    //                                 <title>Test</title>
                    //                             </head>
                    //                             <body>
                    //                                 <h1>Hello World</h1>
                    //                                 <script src="{{test.js}}"></script>
                    //                             </body>
                    //                         </html>
                    //                     `,
                    //                     metadata: { type: "html", name: "index.html",
                    //                         preferredEditorAddress: CONFIG.SELF_HOST+"code",
                    //                      },
                    //                     on_update: {
                    //                         type: "simple",
                    //                     }
                    //                 },
                    //             },
                    //         },
                    //     },
                    //     {
                    //         type: "worker",
                    //         receiver: {
                    //             instance_id: "ui",
                    //             modality: "ui",
                    //             resource_id: `ui`,
                    //         },
                    //         payload: {
                    //             setVertexPayload: {
                    //                 vertexId: p.vertexId,
                    //                 payload: {
                    //                     assetMetadata: { type: "html", name: "index.html",
                    //                         preferredEditorAddress: CONFIG.SELF_HOST+"code",
                    //                      },
                    //                 }
                    //             }
                    //         },
                    //     }
                    // ],
                    // });
                }}
            />
        </div>
      </div>



    </div>
  );
}

export default Lobby;