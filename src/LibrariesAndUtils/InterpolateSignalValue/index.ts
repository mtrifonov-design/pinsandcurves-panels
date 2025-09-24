
type Keyframe = {
    type: number,
    value: number,
    frame: number,
    inControls: [number, number],
    outControls: [number, number]
}


function interpolateSignalValue(keyframes : Keyframe[], playheadPosition: number) : number {
    const sortedKeyframes = keyframes.sort((a, b) => a.frame - b.frame);
    if (sortedKeyframes.length === 0) {
        return 0; 
    }

    if (playheadPosition <= sortedKeyframes[0].frame) {
        return sortedKeyframes[0].value;
    }

    if (playheadPosition >= sortedKeyframes[sortedKeyframes.length - 1].frame) {
        return sortedKeyframes[sortedKeyframes.length - 1].value;
    }

    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
        const kf1 = sortedKeyframes[i];
        const kf2 = sortedKeyframes[i + 1];

        if (playheadPosition >= kf1.frame && playheadPosition <= kf2.frame) {
            const t = (playheadPosition - kf1.frame) / (kf2.frame - kf1.frame);
            return kf1.value * (1 - t) + kf2.value * t;
        }
    }

    throw new Error("Interpolation error: playhead position must be off.");
}

export default interpolateSignalValue;