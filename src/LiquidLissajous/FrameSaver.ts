
import { TimelineController } from "@mtrifonov-design/pinsandcurves-external";
import JSZip from "jszip";


class FrameSaver {
    #timeline : TimelineController.TimelineController;
    #width : number;    
    #height : number;
    #canvas : HTMLCanvasElement;
    #anticipatedFrame : number;
    #frames : any[] = [];
    constructor({ timeline, width, height }) {
        //console.log('FrameSaver', timeline, width, height);
        this.#timeline = timeline;
        this.#width = width;
        this.#height = height;
    }

    addCanvas(canvas) {
        this.#canvas = canvas;
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
        const project = this.#timeline.getProject();
        const currentFrame = project.timelineData.playheadPosition;
        if (currentFrame !== this.#anticipatedFrame) return;
        const focusRange = project.timelineData.focusRange;
        if (currentFrame < focusRange[1]) {
            // get p5js canvas
            const canvas = document.querySelector('canvas');
            this.#frames.push(canvas.toDataURL());
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
            jszip.generateAsync({ type: 'blob' }).then(function (content) {
                const blobUrl = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = 'frames.zip';
                a.click();
                URL.revokeObjectURL(blobUrl);
            });
            this.#frames = [];
            this.#anticipatedFrame = 0;
            this.#timeline.projectTools.updatePlayheadPosition(0, true);
            this.#rendering = false;
            this.#status ={
                ...this.#status,
                renderedFrames: 0,
                totalFrames: 0,
                rendering: false,
            }
        }

    }

    #rendering = false;
    begin() {
        if (this.#rendering) return;
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