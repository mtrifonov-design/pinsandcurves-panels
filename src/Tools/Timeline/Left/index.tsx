import { useState } from "react";
import { trackHeight } from "../Right/constants";
import { MDndBox, MDndContainer, MDndTopProvider, useMDndDragHandle } from "./minimal-dnd";
import { produce } from "immer";
import EffectContainer from "./EffectContainer";

function LittleHat({ open, toggle }: { open: boolean, toggle: () => void }) {
    return <span onClick={toggle} style={{
        display: "inline-block",
        width: "0",
        height: "0",
        marginRight: "6px",
        verticalAlign: "middle",
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderTop: open ? "none" : "12px solid black",
        borderBottom: open ? "12px solid black" : "none",
        cursor: "pointer"
    }}></span>;
}


function Layer({ layer, state, updateState, idx }: { layer: any, state: any, updateState: (entry: any) => void, idx: number }) {
    const open = !state.local.data.hiddenLayers.includes(layer.id);
    const setOpen = (newOpen: boolean) => {
        const nextState = produce(state, (draft: any) => {
            if (newOpen) {
                draft.local.data.hiddenLayers = draft.local.data.hiddenLayers.filter((x: string) => x !== layer.id);
            } else {
                draft.local.data.hiddenLayers.push(layer.id);
            }
        });
        updateState(nextState);
    };
    const { onPointerDown } = useMDndDragHandle(idx);
    return <div>
    
        <div style={{ height: `${trackHeight}px`, cursor: "grab" }}><LittleHat open={open} toggle={() => setOpen(!open)} /> 
            <span onPointerDown={onPointerDown}>
                {layer.id}
            </span>
                
        </div>
        <div>
            {open && <EffectContainer state={state} layerIdx={idx} layer={layer} updateState={updateState} />}
        </div>
    </div>;
}

function TimelineLeftSide({ state, updateState }: { state: any, updateState: (entry: any) => void }) {
    return <MDndTopProvider><div style={{
        padding: "12px",
    }}>
        <MDndContainer containerId="layers" onCommit={(startIdx, idx, direction) => { 
            const nextState = produce(state, (draft: any) => {
                if (idx === null || direction === null) return;
                const layers = draft.composition.data.layers.map((layer, i) => [layer, i]);
                layers.push([draft.composition.data.layers[startIdx], idx -0.25 * direction]);
                layers.sort((a, b) => a[1] - b[1]);
                //console.log(layers);
                draft.composition.data.layers = layers
                .filter(([x,i]) => i !== startIdx)
                .map(x => x[0]);
            });
            updateState(nextState);
         }}>
            {state.composition.data.layers.map((layer: any, layerIndex: number) => (
                <MDndBox key={layer.id} idx={layerIndex}>
                <Layer key={layer.id} state={state} layer={layer} idx={layerIndex} updateState={updateState} />
                </MDndBox>
            ))}
        </MDndContainer>
    </div>
    </MDndTopProvider>;
}

export default TimelineLeftSide;