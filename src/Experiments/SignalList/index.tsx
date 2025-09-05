import { useReducer, useRef, useState } from "react";
import FullscreenLoader from "../../LibrariesAndUtils/FullscreenLoader/FullscreenLoader";

import SignalListContent from "./SignalListContent";
import { AssetProvider } from "../../AssetManager/context/AssetProvider";

import TimelineProvider, { useTimeline } from "../TimelineUtils/TimelineProvider";


function SignalList() {

    const timeline = useTimeline();
    if (!timeline) {
        return <FullscreenLoader />;
    }
    return <SignalListContent timeline={timeline} />;


}


export default function Index() {

    return <AssetProvider>
        <TimelineProvider>
            <SignalList />
    </TimelineProvider>
</AssetProvider>


}
