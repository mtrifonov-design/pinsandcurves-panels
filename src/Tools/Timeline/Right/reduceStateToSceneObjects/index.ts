import { CompositionData, LocalData, TimelineData } from "../../datastructures"
import stateToTracks from "./tracks"
import stateToKeyframes from "./keyframes"
import preSceneToSceneObjects from "./preSceneToSceneObjects"
import stateToPlayhead from "./playhead"
import stateToSelectionBox from "./selectionBox"
import stateToSelectionContainer from "./selectionContainer"
import stateToTransformBox from "./transformBox"
import stateToRuler from "./ruler"
import stateToFocusRange from "./focusRange"

type GeometryComponent = {
    x: number,
    y: number,
    w: number,
    h: number,
}



type __PreGeometryComponent = {
    anchor: "center" | "top-left",
    x: [number, "world" | "screen"],
    y: [number, "world" | "screen"],
    w: [number, "world" | "screen"],
    h: [number, "world" | "screen"],
}

type SceneObject = {
    id: string,
    geometry: GeometryComponent,
    [key: string]: any
}

type PreSceneObject = {
    id: string,
    __pre_geometry: __PreGeometryComponent,
    [key: string]: any
}

type State = {
    local: LocalData,
    timeline: TimelineData,
    composition: CompositionData
}



function reduceStateToSceneObjects(state: State) : SceneObject[] {
    let preSceneObjects: (PreSceneObject | undefined)[] = [];

    const { tracks, signalToTrack } = stateToTracks(state);
    preSceneObjects.push(...tracks);

    const { keyframes } = stateToKeyframes(state, signalToTrack);
    preSceneObjects.push(stateToTransformBox(state, signalToTrack));
    preSceneObjects.push(...keyframes);
    preSceneObjects.push(stateToSelectionBox(state));
    preSceneObjects.push(stateToSelectionContainer(state));
    preSceneObjects.push(...stateToRuler(state));
    preSceneObjects.push(...stateToFocusRange(state));
    preSceneObjects.push(...stateToPlayhead(state));
    
    // Reduce the state to scene objects
    preSceneObjects = preSceneObjects.filter(obj => obj !== undefined);

    return preSceneToSceneObjects(preSceneObjects as PreSceneObject[],state);
};

export type { SceneObject, __PreGeometryComponent, State, PreSceneObject };
export default reduceStateToSceneObjects;