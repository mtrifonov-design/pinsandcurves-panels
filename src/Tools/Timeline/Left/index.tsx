import { useState } from "react";
import { trackHeight } from "../Right/constants";
import { MDndBox, MDndContainer, MDndTopProvider, useMDndDragHandle } from "./minimal-dnd";
import { produce } from "immer";
import EffectContainer from "./EffectContainer";
import { Icon } from "@mtrifonov-design/pinsandcurves-design";

function LittleHat({ open, toggle }: { open: boolean, toggle: () => void }) {
    return <Icon iconName={open ? "keyboard_arrow_down" : "keyboard_arrow_up"} onClick={toggle}></Icon>;
}


function Layer({ layer, state, updateState, idx }: { layer: any, state: any, updateState: (entry: any) => void, idx: number }) {
    const currentSelection = state.local.data.selection.currentSelection;
    const selected = currentSelection.type === "layer" && currentSelection.contents.includes(layer.id);
    const select = () => {
        const nextState = produce(state, (draft: any) => {
            draft.local.data.selection.currentSelection = { type: "layer", contents: [layer.id] };
        });
        updateState(nextState);
    }
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
    return <div style={{
    }}>
    
        <div style={{ height: `${trackHeight}px`,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: selected ? "var(--gray2)" : "transparent",
        }}><LittleHat open={open} toggle={() => setOpen(!open)} /> 
            <span className="materialSymbols" onPointerDown={onPointerDown} style={{cursor: "grab", paddingRight: "4px"}}>drag_indicator</span>
            <span onClick={select} style={{ cursor: "pointer", userSelect: "none" }}>
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
        paddingTop: "12px",
        paddingBottom: "12px",
        backgroundColor: "var(--gray1)",
        color: "var(--gray6)"
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