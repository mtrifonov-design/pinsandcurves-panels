import { useState } from "react";
import { trackHeight } from "../Right/constants";
import { MDndBox, MDndContainer, MDndTopProvider, useMDndDragHandle } from "./minimal-dnd";
import { produce } from "immer";
import EffectContainer from "./EffectContainer";
import { Icon } from "@mtrifonov-design/pinsandcurves-design";
import styles from "./styles.module.css";
import { DropdownMenu } from "radix-ui";
import { createEffect } from "../../../LibrariesAndUtils/Effects";
import { useCK } from "../../../CK_Adapter/CK_Provider";
import CONFIG from "../../../Config";


function addCircle(state: any, updateState: (entry: any) => void, FreeWorkload: any) {
    const instanceId = 'circle_'+crypto.randomUUID();
    const { assetsToCreate, signalsToCreate, effectSignature } = createEffect("exampleCircle", instanceId);
    const nextState = produce(state, (draft: any) => {
        draft.composition.data.layers[0].effects.push(effectSignature);
        draft.timeline.data.signals.push(...signalsToCreate);
        signalsToCreate.forEach((signal: string) => {
            draft.timeline.data.signalKeyframes[signal] = [];
        });
    });
    updateState(nextState);
    assetsToCreate.forEach((asset) => {
        createAsset(FreeWorkload, asset.data, asset.metadata.type, asset.id, "");
    });
}

function createAsset(FreeWorkload: any, defaultData: any, defaultType: string, defaultName: string, preferredEditorAddress: string) {
    const workload = FreeWorkload();
            workload.thread("default").worker({
                instance_id: "ASSET_SERVER",
                modality: "wasmjs",
                resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
            }, {
                createAsset: {
                    asset: {
                        data: defaultData,
                        metadata: {
                            type: defaultType,
                            name: defaultName,
                            preferredEditorAddress: CONFIG.SELF_HOST + preferredEditorAddress,
                        },
                        on_update: {
                            type: "simple",
                        },
                        id: defaultName,
                    },
                },
            });
    workload.dispatch();
}

function LittleHat({ open, toggle }: { open: boolean, toggle: () => void }) {
    return <Icon iconName={open ? "keyboard_arrow_down" : "keyboard_arrow_up"} onClick={toggle}></Icon>;
}


function Layer({ layer, state, updateState, idx }: { layer: any, state: any, updateState: (entry: any) => void, idx: number }) {
    const { FreeWorkload } = useCK();
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
            justifyContent: "space-between",
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
                <span className="materialSymbols" onPointerDown={onPointerDown} style={{cursor: "grab", paddingRight: "4px"}}>drag_indicator</span>
                <span onClick={select} style={{ cursor: "pointer", userSelect: "none" }}>
                    {layer.id}
                </span>
            </div>
            <div>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <span className="materialSymbols" style={{ cursor: "pointer", paddingRight: "4px" }}>more_vert</span>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content>
                            <DropdownMenu.Item onSelect={() => {
                                addCircle(state, updateState, FreeWorkload);
                            }} className={styles.dropdownItem}>Add Circle</DropdownMenu.Item>
                            <DropdownMenu.Item onSelect={() => {
                                const nextState = produce(state, (draft: any) => {
                                    draft.composition.data.layers = draft.composition.data.layers.filter((l: any) => l.id !== layer.id);
                                    draft.local.data.selection.currentSelection = { type: "none", contents: [] };
                                });
                                updateState(nextState);
                            }} className={styles.dropdownItem}>Delete Layer</DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>
        </div>
        <div>
            {open && <EffectContainer state={state} layerIdx={idx} layer={layer} updateState={updateState} />}
        </div>
    </div>;
}

function TimelineLeftSide({ state, updateState }: { state: any, updateState: (entry: any) => void }) {
    return <MDndTopProvider><div style={{
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