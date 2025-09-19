import { ControlsData } from "../../controls";
import CachedStream from "./CachedStream";

const globalStream = new CachedStream();
function globalStreamReducer(state: ControlsData) {
    globalStream.updateStream([{
            resource: "cyberspag_globals",
            type: "setGlobals",
            payload: [{
                origin: [state.centerX, state.centerY, state.centerZ, 0],
                temperature: [state.temperature],
                pressure: [state.pressure],
                showUI: [state.showUI],
            }]
        }, {
            resource: "cyberspag_blur",
            type: "setGlobals",
            payload: [{
                amount: [state.temperature]
            }]
        },
        {
            resource: "rope_seg_instance",
            type: "setInstanceData",
            payload: [{}, 1000]
        }
        ],);
    return globalStream.getStream();
}


export default globalStreamReducer;

// let cache;
// let sliceCache;
// function globalStream(state: ControlsData) {
//     const stateSlice = {
//         centerX: state.centerX,
//         centerY: state.centerY,
//         centerZ: state.centerZ,
//         temperature: state.temperature,
//         pressure: state.pressure,
//         showUI: state.showUI
//     }

//     if (JSON.stringify(stateSlice) === sliceCache) {
//         return cache;
//     }

//     sliceCache = JSON.stringify(stateSlice);
//     cache = {
//         versionId: crypto.randomUUID(),
//         commands: [{
//             resource: "cyberspag_globals",
//             type: "setGlobals",
//             payload: [{
//                 origin: [state.centerX, state.centerY, state.centerZ, 0],
//                 temperature: [state.temperature],
//                 pressure: [state.pressure],
//                 showUI: [state.showUI],
//             }]
//         }, {
//             resource: "cyberspag_blur",
//             type: "setGlobals",
//             payload: [{
//                 amount: [state.temperature]
//             }]
//         },
//         {
//             resource: "rope_seg_instance",
//             type: "setInstanceData",
//             payload: [{}, 1000]
//         }
//         ],
//     };
//     return cache;
// }

// export default globalStream;