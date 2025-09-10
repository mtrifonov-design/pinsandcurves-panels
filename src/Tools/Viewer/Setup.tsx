import React from 'react';
import FullscreenLoader from '../../LibrariesAndUtils/FullscreenLoader/FullscreenLoader.js';
import Interior from './Interior.js';

export default function Setup({ timeline, controls, graphics }) {
    const ready = timeline && controls && graphics;
    if (!ready) {
        return <FullscreenLoader />
    }
    return <Interior controls={controls} timeline={timeline} graphics={graphics} />
}
