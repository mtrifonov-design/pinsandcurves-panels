import React from 'react';
import FullscreenLoader from '../../LibrariesAndUtils/FullscreenLoader/FullscreenLoader.js';
import Interior from './Interior.js';

export default function Setup({ timeline, controls, image }) {
    const ready = timeline && controls && image;
    if (!ready) {
        return <FullscreenLoader />
    }
    return <Interior controls={controls} timeline={timeline} image={image} />
}
