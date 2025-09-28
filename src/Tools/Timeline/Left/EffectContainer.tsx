
import { useState } from "react";
import { trackHeight } from "../Right/constants";
import { MDndBox, MDndContainer, MDndTopProvider, useMDndDragHandle } from "./minimal-dnd";
import { produce } from "immer";
import Signal from "./Signal";
import { Icon } from "@mtrifonov-design/pinsandcurves-design";
import styles from "./styles.module.css";
import { DropdownMenu } from 'radix-ui'

function LittleHat({ open, toggle }: { open: boolean, toggle: () => void }) {
    return <Icon iconName={open ? "keyboard_arrow_down" : "keyboard_arrow_up"} onClick={toggle}></Icon>;
}


function Effect({ state, effect, updateState, idx }: { effect: any, updateState: (entry: any) => void, idx: number, state: any }) {
    const currentSelection = state.local.data.selection.currentSelection;
    const selected = currentSelection.type === "effect" && currentSelection.contents.includes(effect.instanceId);
    const select = () => {
        const nextState = produce(state, (draft: any) => {
            draft.local.data.selection.currentSelection = { type: "effect", contents: [effect.instanceId] };
        });
        updateState(nextState);
    }
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
    return <div style={{ marginLeft: "20px" }}>
        <div style={{ height: `${trackHeight}px`,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: selected ? "var(--gray2)" : "transparent",
            justifyContent: "space-between",
            //borderLeft: "2px solid var(--gray2)",
        }}
        className={styles.rowStyle}
        >
            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "4px",
            }}>
                <LittleHat open={open} toggle={() => setOpen(!open)} />
                <span className="materialSymbols" onPointerDown={onPointerDown} style={{cursor: "grab",  paddingRight: "4px" }}>drag_indicator</span>
                <span onClick={select} style={{ cursor: "pointer", userSelect: "none" }}>
                fx: {effect.type} {effect.instanceId}
                </span>
            </div>
            <div>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <span className="materialSymbols" style={{ cursor: "pointer", paddingRight: "4px" }}>more_vert</span>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content side="top" align="end" className={styles.dropdownContent} sideOffset={5}>
                            <DropdownMenu.Item className={styles.dropdownItem} onSelect={() => {
                                const nextState = produce(state, (draft: any) => {
                                    draft.composition.data.layers.forEach((layer: any) => {
                                        layer.effects = layer.effects.filter((e: any) => e.instanceId !== effect.instanceId);
                                    });
                                    draft.local.data.selection.currentSelection = { type: "none", contents: [] };
                                });
                                updateState(nextState);
                            }}>Delete Effect</DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>

        </div>
        <div>{open && Object.entries(effect.signals).map(([signalName, signalId]) => <Signal key={signalId} state={state} signalId={signalId} signalName={signalName} updateState={updateState} />)}</div>
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