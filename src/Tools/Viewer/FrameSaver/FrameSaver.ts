
import { TimelineController } from "@mtrifonov-design/pinsandcurves-external";
import JSZip from "jszip";
import { imagesToMp4 } from "./imagesToMp4";

class FrameSaver {
    #timeline: TimelineController.TimelineController;
    #width: number;
    #height: number;
    #anticipatedFrame: number;
    #frames: any[] = [];
    #canvas: HTMLCanvasElement;
    

    constructor({ timeline, width, height }) {
        //console.log('FrameSaver', timeline, width, height);
        this.#timeline = timeline;
        this.#width = width;
        this.#height = height;
        this.#canvas = document.createElement("canvas");
    }

    #compName : string = "untitled";
    setName(name: string) {
        this.#compName = name;
    }

    setSize(width: number, height: number) {
        // make sure width and height are even
        let cwidth = width;
        let cheight = height;
        if (width % 2 !== 0) {
            cwidth = width + 1;
        }
        if (height % 2 !== 0) {
            cheight = height + 1;
        }
        this.#width = width;
        this.#height = height;
        this.#canvas.width = cwidth;
        this.#canvas.height = cheight;
    }

    #captureFrameCallback: (() => Uint8ClampedArray) | null = null;
    attachCaptureFrame(callback: () => Uint8ClampedArray) {
        this.#captureFrameCallback = callback;
    }

    #subscribers = [];
    subscribe(cb: () => void) {
        this.#subscribers.push(cb);
        return () => {
            this.#subscribers = this.#subscribers.filter((s) => s !== cb);
        }
    }

    #status = {
        rendering: false,
        totalFrames: 0,
        renderedFrames: 0,
    }
    getStatus() {
        return this.#status;
    }

    frame() {
        if (!this.#rendering) return;
        if (!this.#canvas) return;
        if (!this.#captureFrameCallback) return;
        const project = this.#timeline.getProject();
        const currentFrame = project.timelineData.playheadPosition;
        if (currentFrame !== this.#anticipatedFrame) return;
        const focusRange = project.timelineData.focusRange;
        if (currentFrame < focusRange[1]) {
            // get p5js canvas
            const canvas = this.#canvas;
            const ctx = canvas.getContext("2d");
            const data = this.#captureFrameCallback();
            const w = this.#width;
            const h = this.#height;
            //console.log(w,h);

            const clamped =
                data instanceof Uint8ClampedArray
                    ? data
                    : new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);

                // (optional) sanity check
                if (clamped.length !== w * h * 4) {
                throw new Error(`Bad length: got ${clamped.length}, expected ${w*h*4}`);
                }
            const imageData = new ImageData(clamped, this.#width, this.#height);
            ctx.putImageData(imageData, 0, 0);
            const dataurl = canvas.toDataURL("image/png");
            //console.log("dataurl", dataurl, canvas, canvas.width);
            this.#frames.push(dataurl);
            this.#anticipatedFrame = currentFrame + 1;
            this.#timeline.projectTools.updatePlayheadPosition(currentFrame + 1, true);
            this.#status = {
                ...this.#status,
                renderedFrames: this.#status.renderedFrames + 1,
            }
        } else {
            // finish rendering
            const jszip = new JSZip();
            const folder = jszip.folder('frames');
            this.#frames.forEach((frame, index) => {
                const base64Data = frame.split(',')[1];
                const binaryString = window.atob(base64Data);
                const binaryLen = binaryString.length;
                const bytes = new Uint8Array(binaryLen);
                for (let i = 0; i < binaryLen; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const fileName = 'frame' + String(index).padStart(5, '0') + '.png';
                folder.file(fileName, bytes, { base64: true });
            });
            if (this.#renderMode === "imseq") {
                jszip.generateAsync({ type: 'blob' }).then(content =>  {
                    const blobUrl = URL.createObjectURL(content);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `${this.#compName}.zip`;
                    a.click();
                    URL.revokeObjectURL(blobUrl);
                    this.#status = {
                        ...this.#status,
                        renderedFrames: 0,
                        totalFrames: 0,
                        rendering: false,
                    }
                    this.#timeline.projectTools.updatePlayheadPosition(0, true);
                });
            }
            if (this.#renderMode === "mp4") {
                const mp4 = imagesToMp4(this.#frames, {
                    width: this.#width,
                    height: this.#height,
                    fps: 30,
                }).then(mp4Blob => {
                    const mp4BlobUrl = URL.createObjectURL(mp4Blob);
                    const a = document.createElement('a');
                    a.href = mp4BlobUrl;
                    a.download = `${this.#compName}.mp4`;
                    a.click();
                    URL.revokeObjectURL(mp4BlobUrl);
                    this.#status = {
                        ...this.#status,
                        renderedFrames: 0,
                        totalFrames: 0,
                        rendering: false,
                    }
                    this.#timeline.projectTools.updatePlayheadPosition(0, true);
                })
            }
            this.#frames = [];
            this.#anticipatedFrame = 0;
            this.#rendering = false;
        }

    }


    #renderMode = 'imseq'; // or 'mp4'
    beginImSeq() {
        if (this.#rendering) return;
        this.#renderMode = 'imseq';
        this.begin();
    }

    beginMp4() {
        if (this.#rendering) return;
        this.#renderMode = 'mp4';
        this.begin();
    }

    #rendering = false;
    begin() {
        this.#rendering = true;
        const project = this.#timeline.getProject();
        const focusRange = project.timelineData.focusRange;
        this.#anticipatedFrame = focusRange[0];
        this.#status = {
            rendering: true,
            totalFrames: focusRange[1] - focusRange[0],
            renderedFrames: 0,
        }
        this.#timeline.projectTools.updatePlayheadPosition(focusRange[0], true);
    }

}

export default FrameSaver;