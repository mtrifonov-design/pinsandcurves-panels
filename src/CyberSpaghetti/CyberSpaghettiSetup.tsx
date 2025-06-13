import React from 'react';
import FullscreenLoader from '../FullscreenLoader/FullscreenLoader.js';
import CyberSpaghettiInterior from './CyberSpaghettiInterior.js';

export default function CyberSpaghettiSetup({ timeline, controls }) {
    const ready = timeline && controls;
    if (!ready) {
        return <FullscreenLoader />
    }
    return <CyberSpaghettiInterior controls={controls} timeline={timeline} />
}
