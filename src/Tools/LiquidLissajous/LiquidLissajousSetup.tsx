import React from 'react';
import FullscreenLoader from '../../LibrariesAndUtils/FullscreenLoader/FullscreenLoader.js';
import LiquidLissajousInterior from './LiquidLissajousInterior';

export default function LiquidLissajousSetup({ timeline, controls }) {
    const ready = timeline && controls;
    if (!ready) {
        return <FullscreenLoader />
    }

    // check if webgpu is supported
    // if (!navigator.gpu) {
    //     return <div style={{
    //         width: "100vw",
    //         height: "100vh",
    //         backgroundColor: "var(--gray1)",
    //         display: "flex",
    //         justifyContent: "center",
    //         alignItems: "center",
    //         color: "var(--gray6)",
    //         padding: 20,
    //     }}>
    //         <div>
    //             <h3 style={{
    //                 color: "var(--gray7)",
    //             }}>WebGPU is not (yet) supported in this browser.</h3>
    //             <p style={{
    //                 color: "var(--gray6)",
    //             }}>
    //                 Sorry for the inconvenience! <br />
    //                 WebGPU is a new technology which is not yet supported in all major browsers,
    //                 but is available in the latest versions of Chrome and Edge. <br />
    //             </p>
    //         </div>
    //     </div>
    // }

    return <LiquidLissajousInterior controls={controls} timeline={timeline} />
}
