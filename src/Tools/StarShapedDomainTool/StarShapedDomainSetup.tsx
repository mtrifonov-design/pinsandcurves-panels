import React from 'react';
import FullscreenLoader from '../../LibrariesAndUtils/FullscreenLoader/FullscreenLoader.js';
import LiquidLissajousInterior from './StarShapedDomainInterior.js';

export default function StarShapedDomainSetup({ timeline, controls }) {
    const ready = timeline && controls;
    if (!ready) {
        return <FullscreenLoader />
    }
    return <LiquidLissajousInterior controls={controls} timeline={timeline} />
}
