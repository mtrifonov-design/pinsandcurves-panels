import { produce } from "immer";

class Timeline {

    asset: any;
    constructor(asset: any) {
        this.asset = asset;
    }
    receiveUpdate(asset: any) {
        this.asset = asset;
    }

    get data() {
        return this.asset.getSnapshot().data;
    }

    update(newData : any) {
        this.asset.setData(newData);
    }
    
    get projectTools() {
        const tools = {
            updatePlayheadPosition: (frame: number, commit: boolean) => {
                this.asset.setData(produce(this.asset.getSnapshot(), draft => {
                    draft.data.general.playheadPosition = frame;
                    draft.data.general.playing = false;
                }));
            },
            startPlayback: () => {
                this.asset.setData(produce(this.asset.getSnapshot(), draft => {
                    draft.data.general.playing = true;
                    draft.data.general.playingTimestamp = Date.now();
                }));
            },
        }
        return tools;
    }

    get playheadPosition() {
        const snapshot = this.asset.getSnapshot();
        const playing = snapshot.data.general.playing;
        if (!playing) {
            return snapshot.data.general.playheadPosition;
        } else {
            const elapsed = Date.now() - snapshot.data.general.playingTimestamp;
            const framesAdvanced = Math.floor((elapsed / 1000) * snapshot.data.general.frameRate);
            let newPosition = snapshot.data.general.playheadPosition + framesAdvanced;
            if (newPosition > snapshot.data.general.focusRange[1]) {
                newPosition = snapshot.data.general.focusRange[0] + (newPosition - snapshot.data.general.focusRange[1]) % (snapshot.data.general.focusRange[1] - snapshot.data.general.focusRange[0]);
            }
            return newPosition;
        }

    }
}
export { Timeline };