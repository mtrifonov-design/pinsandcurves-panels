
import { useState } from "react";
import { trackHeight } from "../Right/constants";
import { MDndBox, MDndContainer, MDndTopProvider, useMDndDragHandle } from "./minimal-dnd";
import { produce } from "immer";

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

function Signal({ signal, updateState }: { signal: any, updateState: (entry: any) => void }) {
    return <div style={{ marginLeft: "24px", height: `${trackHeight}px` }}>
        s: {signal}
    </div>
}

function Effect({ state, effect, updateState, idx }: { effect: any, updateState: (entry: any) => void, idx: number, state: any }) {
    const { onPointerDown } = useMDndDragHandle(idx);
    const open = !state.local.data.hiddenEffects.includes(effect.instanceId);
    const setOpen = (newOpen: boolean) => {
        const nextState = produce(state, (draft: any) => {
            if (newOpen) {
                draft.local.data.hiddenEffects = draft.local.data.hiddenEffects.filter((x: string) => x !== effect.instanceId);
            } else {
                draft.local.data.hiddenEffects.push(effect.instanceId);
            }
        });
        updateState(nextState);
    };
    return <div style={{ marginLeft: "12px" }}>
        <div style={{ height: `${trackHeight}px` }}><LittleHat open={open} toggle={() => setOpen(!open)} /> 
            <span onPointerDown={onPointerDown}>
            fx: {effect.type} {effect.instanceId}
            </span>
        </div>
        <div>{open && effect.signals.map((signal: any) => <Signal key={signal} signal={signal} updateState={updateState} />)}</div>
    </div>
}


function EffectContainer({ state, layerIdx, layer, updateState }: { state: any, layerIdx: number, layer: any, updateState: (entry: any) => void }) {
    //console.log(layer);
    return <MDndContainer containerId={layer.id} onCommit={(startIdx, idx, direction) => {
            const nextState = produce(state, (draft: any) => {
                if (idx === null || direction === null) return;
                const effects = draft.composition.data.layers[layerIdx].effects.map((effect, i) => [effect, i]);
                //console.log(startIdx,draft.composition.data.layers[layerIdx].effects[startIdx])
                effects.push([draft.composition.data.layers[layerIdx].effects[startIdx], idx -0.25 * direction]);
                effects.sort((a, b) => a[1] - b[1]);
                //console.log(effects);
                draft.composition.data.layers[layerIdx].effects = effects
                .filter(([x,i]) => i !== startIdx)
                .map(x => x[0]);
            });
            //console.log("nextState",nextState);
            updateState(nextState);
    }}>
    {layer.effects.map((effect: any, effectIndex: number) => {
        //console.log(effect);
        return <MDndBox key={effect.instanceId} idx={effectIndex}>
        <Effect key={effect.instanceId} state={state} effect={effect} idx={effectIndex} updateState={updateState} />
    </MDndBox>}
    )}
    </MDndContainer>
}

export default EffectContainer;