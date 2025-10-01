import { trackHeight } from "../Right/constants";
import { useMDndDragHandle } from "./minimal-dnd";
import { produce } from "immer";
import EffectContainer from "./EffectContainer";
import { Icon, SimpleCommittedTextInput } from "@mtrifonov-design/pinsandcurves-design";
import styles from "./styles.module.css";
import { DropdownMenu } from "radix-ui";
import { createEffect, effectsList } from "../../../LibrariesAndUtils/Effects";
import { useCK } from "../../../CK_Adapter/CK_Provider";
import CONFIG from "../../../Config";
import { ToggleExpand } from "./UIComponents";


function addEffect(layerIdx: number, effectName: string, state: any, updateState: (entry: any) => void, FreeWorkload: any) {
    const instanceId = 'fx_'+crypto.randomUUID();
    const { assetsToCreate, signalsToCreate, effectSignature } = createEffect(effectName, instanceId);
    const nextState = produce(state, (draft: any) => {
        draft.composition.data.layers[layerIdx].effects.push(effectSignature);
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
    const addLayer = (e: React.PointerEvent) => {
        e.stopPropagation();
        const nextState = produce(state, (draft: any) => {
            const newLayer = {
                id: "layer_" + crypto.randomUUID(),
                name: "New Layer",
                effects: [],
            };
            draft.composition.data.layers.push(newLayer);
        });
        updateState(nextState);
    };
    return <div style={{
    }}>
    
        <div style={{ height: `${trackHeight}px`,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: selected ? "var(--gray2)" : "transparent",
            justifyContent: "space-between",
        }}
        className={styles.rowStyle+" "+styles.showOnHover}
        >
            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "4px",
            }}>
                <span className="materialSymbols" onPointerDown={onPointerDown} style={{cursor: "grab", paddingRight: "4px", opacity: "var(--hoverOpacity)", paddingLeft: "4px"}}>drag_indicator</span>

                {/* <span className="materialSymbols" onPointerDown={addLayer} style={{cursor: "pointer", paddingRight: "4px", opacity: "var(--hoverOpacity)"}}>add</span> */}

                <ToggleExpand open={open} toggle={() => setOpen(!open)} />
                <SimpleCommittedTextInput
                    initialValue={layer.name}
                    onCommit={(newName: string) => {
                        const nextState = produce(state, (draft: any) => {
                            draft.composition.data.layers[idx].name = newName;
                        });
                        updateState(nextState);
                    }}
                    key={layer.name}
                    bgColor="var(--gray1)"
                />
            </div>
            <div>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <span className="materialSymbols" style={{ cursor: "pointer", paddingRight: "4px" }}>more_vert</span>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content className={styles.dropdownContent}>
                            {effectsList.map((effectName, effectIdx) => (<DropdownMenu.Item key={effectIdx} className={styles.dropdownItem} onSelect={() => {
                                addEffect(idx, effectName, state, updateState, FreeWorkload);
                            }}>Add {effectName}</DropdownMenu.Item>))}
                            {/* <DropdownMenu.Item className={styles.dropdownItem} onSelect={() => {
                                addEffect(idx, "exampleCircle", state, updateState, FreeWorkload);
                            }}>Add Circle</DropdownMenu.Item> */}
                            <DropdownMenu.Item className={styles.dropdownItem} onSelect={() => {
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

function NewLayerStub({state, updateState}) {
    const addLayer = () => {
        const nextState = produce(state, (draft: any) => {
            const newLayer = {
                id: "layer_" + crypto.randomUUID(),
                name: "New Layer",
                effects: [],
            };
            draft.composition.data.layers.push(newLayer);
        });
        updateState(nextState);
    };
    return <div onClick={addLayer} style={{
        cursor: "pointer", padding: "4px", 
        //color: "var(--gray3)",
        marginLeft: "20px", 
        position: "relative",
        display: "flex", alignItems: "center", gap: "4px",
        height: `${trackHeight}px`,
        userSelect: "none",
        }}
        className={styles.highlightTextOnHover}>
        <span className="materialSymbols" style={{paddingRight: "4px", paddingLeft: "4px"}}>add</span>
        <span style={{paddingLeft: "4px", userSelect: "none"}}>Add New Layer</span>
    </div>;
}

export {NewLayerStub}

export default Layer;