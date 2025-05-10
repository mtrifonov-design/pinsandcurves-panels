import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { PinsAndCurvesProjectController as ProjectController } from '@mtrifonov-design/pinsandcurves-external';
import CONFIG from '../Config';

type ProjectTools = ProjectController.ProjectTools;
type Project = ProjectController.Project;
const PostMessageAPI = ProjectController.PostMessageAPI;

const P5JSCanvas: React.FC<{
    project: Project,
    projectTools: ProjectTools,
    sendMessage: (message: any) => void,
    attachMessageCallback: (callback: (message: any) => void) => void,
    assets: any[],
    subscriber_id: string,
}> = ({ project, projectTools, sendMessage, attachMessageCallback, assets, subscriber_id }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const code: string = assets.find((asset) => asset.asset_id === "P5JSSKETCH")?.dataUrl || "";


    useEffect(() => {
        if (iframeRef.current) {
            // add an event listener to messages coming from the iframe
            const subscribe = PostMessageAPI.subscribeToProjectEvents(window.location.origin);
            const unsubscribe = subscribe((projectNodeEvent) => {
                sendMessage({
                    type: "worker",
                    receiver: {
                        instance_id: "BACKGROUND",
                        modality: "wasmjs",
                        resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}ProjectState`
                    },
                    payload: {
                        channel: 'ProjectState',
                        request: 'projectNodeEvent',
                        payload: projectNodeEvent,
                        subscriber_id,
                    }
                });
            })
            return () => {
                unsubscribe();
            }
        }
    }, [iframeRef.current]);


    useEffect(() => {
        if (iframeRef.current) {
            const dispatch = PostMessageAPI.dispatchProjectEvent(iframeRef.current!.contentWindow!, window.location.origin);
            attachMessageCallback((message: any) => {
                const { channel, request, payload } = message;
                // send the message to the iframe
                if (channel === 'ProjectState') {
                    dispatch(payload);
                } 
                else {
                    iframeRef.current?.contentWindow?.postMessage({
                        type: 'P5_Asset_Message',
                        payload: message,
                    }, window.location.origin);
                }

            });
        }
    }, []);

    return (
        <div style={{
            width: '100%', height: '100%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            alignContent: 'center', backgroundColor: 'var(--gray2)'
        }}>
            <CodePreviewContent code={code} ref={iframeRef} assets={assets} />

        </div>
    );
};

const CodePreviewContent = forwardRef(function CodePreviewContent({ code, assets }: { code: string, assets: any[] }, ref: any) {


    useEffect(() => {
        if (ref.current) {
          const html = `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <link rel="stylesheet" type="text/css" href="style.css">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js"></script>
                <script src="https://storage.googleapis.com/pinsandcurvesservice/PinsAndCurvesClient.umd.js"></script>
                <script src="
                  https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
                "></script>
                <style>
                canvas {
                    width: 100%;
                    height: 100%;
                }
                
                </style>
              </head>
              <body style="margin: 0; padding: 0; overflow: hidden;
              display: flex; justify-content: center; align-items: center;
              height: 100vh; width: 100vw;
              ">
              <button id="render" style="position: absolute; top: 10px; left: 10px; z-index: 1000;">Render</button>
                <main></main>
                
                <script>
                  const client = new PinsAndCurvesClient();
                  client.connect();
                  function signal(name,frame) {
                    try {
                      return client.signal(name,frame);
                    } catch (e) {
                      return 0;
                    }
                  };
                  globalThis.signal = signal;
                  {
                  const renderButton = document.getElementById('render');
                  renderButton.addEventListener('click', () => {
                    render()
                  });

                  let frames = [];

                  function renderLoop() {
                    if (!rendering) return window.requestAnimationFrame(renderLoop);
                    const project = client.c.getProject();
                    const currentFrame = project.timelineData.playheadPosition;
                    const numberOfFrames = project.timelineData.numberOfFrames;
                    const focusRange = project.timelineData.focusRange;
                    const focusRangeDuration = focusRange[1] - focusRange[0];
                    
                      if (currentFrame === anticipatedFrame) {
                        //console.log('Rendering frame', currentFrame);
                        if (currentFrame < focusRange[1]) {
                          // get p5js canvas
                          const canvas = document.querySelector('canvas');
                          frames.push(canvas.toDataURL());
                          // update the playhead
                          anticipatedFrame = currentFrame + 1;
                          client.c.projectTools.updatePlayheadPosition(currentFrame + 1,true);
                        } else {
                          const jszip = new JSZip();
                          const folder = jszip.folder('frames');
                          frames.forEach((frame, index) => {
                            const base64Data = frame.split(',')[1];
                            const binaryString = window.atob(base64Data);
                            const binaryLen = binaryString.length;
                            const bytes = new Uint8Array(binaryLen);
                            for (let i = 0; i < binaryLen; i++) {
                              bytes[i] = binaryString.charCodeAt(i);
                            }
                            // filename with 5 digits
                            const fileName = 'frame' + String(index).padStart(5, '0') + '.png';
                            folder.file(fileName, bytes, { base64: true });
                          });
                          jszip.generateAsync({ type: 'blob' }).then(function (content) {
                            const blobUrl = URL.createObjectURL(content);
                            const a = document.createElement('a');
                            a.href = blobUrl;
                            a.download = 'frames.zip';
                            a.click();
                            URL.revokeObjectURL(blobUrl);
                          });
                          frames = [];
                          anticipatedFrame = 0;
                          client.c.projectTools.updatePlayheadPosition(0,true);
                          rendering = false;
                        }
                      } 
                      window.requestAnimationFrame(renderLoop);
                
                  }

                  


                  
                  let rendering = false;
                  let anticipatedFrame = 0;
                  function render() {
                    if (rendering) return;
                    rendering = true;
                    
                    const project = client.c.getProject();
                    const focusRange = project.timelineData.focusRange;
                    anticipatedFrame = focusRange[0];
                    client.c.projectTools.updatePlayheadPosition(focusRange[0],true);

                  }
                    renderLoop();
                  }

                  {
                    class Assets {
                      assets = [];
                      constructor() {
                        window.addEventListener('message', (event) => {
                            if (event.origin !== window.location.origin) return;
                            if (!event.data.type) return;
                            ////console.log(event.data)
                            const { payload, type } = event.data;
                            if (type === 'P5_Asset_Message') {
                                this.assets = payload;
                                this.init();
                            }
                        });
                      }

                      callbacks = [];
                      initialized = false;
                      init() {
                        this.initialized = true;
                        this.callbacks.forEach((callback) => {
                          
                          callback();
                        });
                      }

                      async getDataUrl(assetName) {
                        if (!this.initialized) {
                          await new Promise((resolve) => {
                              const callback = () => {
                                  resolve();
                              };
                              this.callbacks.push(callback);
                          });
                        }
                        const asset = this.assets.find((asset) => asset.asset_name === assetName);
                        return asset.dataUrl;
                      }

                      requestedAssets = {};
                      alreadyRequestedAssets = {};
                      getImage(assetName) {
                        if (this.requestedAssets[assetName]) {
                          return this.requestedAssets[assetName];
                        }
                        const requestAsset = async () => {
                          this.alreadyRequestedAssets[assetName] = true;
                          const dataUrl = await this.getDataUrl(assetName);
                          this.requestedAssets[assetName] = loadImage(dataUrl);
                        }
                        if (!this.alreadyRequestedAssets[assetName]) requestAsset();

                        const width = this.assets.find((asset) => asset.asset_name === assetName).width;
                        const height = this.assets.find((asset) => asset.asset_name === assetName).height;

                        return createImage(width, height); 
                      }

                      
                      
                    }

                    globalThis.assets = new Assets();

                    globalThis.setupCanvas = function(width,height) {
                      const canvas = createCanvas(width,height);
                      canvas.canvas.style.width = '100%';
                      canvas.canvas.style.height = '100%';
                    }
 
                  }
                    </script>
                <script defer>

                  ${code}

                </script>
                

              </body>
            </html>
          `;
          const blob = new Blob([html], { type: 'text/html' });
          const blobUrl = URL.createObjectURL(blob);
          ref.current.src = blobUrl;
          // Optionally clean up the blob URL after the iframe loads to avoid memory leaks
          ref.current.addEventListener('load', () => {
            URL.revokeObjectURL(blobUrl);
            ref.current?.contentWindow?.postMessage({
                type: 'P5_Asset_Message',
                payload: assets,
            }, window.location.origin);
        
            }, { once: true });
        }
      }, [code, ref, assets]);


    return (
        <iframe ref={ref} title="Code Preview" style={{ width: '100%', height: '100%', border: "none" }} />
    );
})

export default P5JSCanvas;
