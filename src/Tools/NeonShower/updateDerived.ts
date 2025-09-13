import computeTilt from "./computeTilt";
import { ControlsData } from "./CyberSpaghettiControls";


function updateDerived(oldState: ControlsData, newState: ControlsData) {

    const centerXLast = oldState.centerX;
    const centerYLast = oldState.centerY;
    const tiltXLast = oldState.tiltX;
    const tiltYLast = oldState.tiltY;

    const now = Date.now();
    const before = newState.lastTimestamp;

    const lastTimestamp = now;

    const tiltX = computeTilt({
        now,
        before,
        xPrev: centerXLast,
        xNow: newState.centerX,
        thetaNow: newState.tiltX,
        thetaPrev: tiltXLast,
    });
    const tiltY = computeTilt({
        now,
        before,
        xPrev: centerYLast,
        xNow: newState.centerY,
        thetaNow: newState.tiltY,
        thetaPrev: tiltYLast,
    });

    console.log(tiltX,tiltY);

    const updated = {
        centerXLast,
        centerYLast,
        tiltXLast,
        tiltYLast,
        tiltX,
        tiltY,
        lastTimestamp,
    }

    return { ...newState, ...updated };
};

export default updateDerived;