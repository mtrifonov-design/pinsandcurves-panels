import { useRef, useState } from "react";
import FullscreenLoader from "../FullscreenLoader/FullscreenLoader";
import { useUnit } from "../hooks";


function CodeEditor() {

    // Not Initialised -> Lobby -> Open Editor -> Ready for Termination

    // state machine:
    // Not Initialised -> Lobby
    // Not Initialised -> Ready for Termination
    // Lobby -> Open Editor
    // Lobby -> Ready for Termination
    // Open Editor -> Ready for Termination
    // Open Editor -> Lobby

    const [state,setState] = useState("not_initialised");

    const blockerId = useRef(undefined);
    const index = useRef({
        subscriptionName: "CodeEditor_Index_"+crypto.randomUUID(),
        subscriptionId: undefined,
        data: undefined,
        metadata: undefined,
    });
    const javascriptFile = useRef({
        subscriptionName: "CodeEditor_JavaScriptFile_"+crypto.randomUUID(),
        subscriptionId: undefined,
        data: undefined,
        metadata: undefined,
    });

    useUnit(unit => {
        const { payload, sender } = unit;

        if (state === "not_initialised") {
            const { INIT, TERMINATE, subscriptionConfirmation, unsubscribeConfirmation, blocker_id, getAssetResponse } = payload;
            if (INIT) {
                globalThis.CK_ADAPTER.pushWorkload({
                    default: [{
                        type: "worker",
                        receiver: {
                            instance_id: "ASSET_SERVER",
                            modality: "wasmjs",
                            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
                        },
                        payload: {
                            subscribeToExistingAsset: {
                                asset_id: "index",
                                subscription_name: index.current.subscriptionName,
                            }
                        },
                    }]
                });   
            }
            if (subscriptionConfirmation) {
                const { subscription_id, subscription_name } = subscriptionConfirmation;
                if (subscription_name === index.current.subscriptionName) {
                    index.current.subscriptionId = subscription_id;
                }
            }
            if (getAssetResponse) {
                const { subscription_id, asset_data, asset_metadata } = getAssetResponse;
                if (subscription_id === index.current.subscriptionId) {
                    index.current.data = asset_data;
                    index.current.metadata = asset_metadata;
                    setState("lobby");
                }
            }
            if (TERMINATE) {
                blockerId.current = blocker_id;
                globalThis.CK_ADAPTER.pushWorkload({
                    default: [{
                        type: "worker",
                        receiver: {
                            instance_id: "ASSET_SERVER",
                            modality: "wasmjs",
                            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServer`,
                        },
                        payload: {
                            unsubscribeFromAsset: {
                                asset_id: "index",
                                subscription_id: index.current.subscriptionId,
                            }
                        },
                    }]
                });
            }
            if (unsubscribeConfirmation) {
                const { subscription_id } = unsubscribeConfirmation;
                if (subscription_id === index.current.subscriptionId) {
                    setState("ready_for_termination");
                }
            }
        }

        if (state === "lobby") {
            const { TERMINATE, unsubscribeConfirmation, blocker_id,
                getAssetResponse, deleteNotification, subscriptionConfirmation } = payload;
            if (getAssetResponse) {
                const { subscription_id, asset_data, asset_metadata } = getAssetResponse;
                if (subscription_id === javascriptFile.current.subscriptionId) {
                    javascriptFile.current.data = asset_data;
                    javascriptFile.current.metadata = asset_metadata;
                    setState("open_editor");
                }
            }
            if (subscriptionConfirmation) {
                const { subscription_id, subscription_name } = subscriptionConfirmation;
                if (subscription_name === javascriptFile.current.subscriptionName) {
                    javascriptFile.current.subscriptionId = subscription_id;
                }
            }
            if (deleteNotification) {
                const { subscription_id } = deleteNotification;
                if (subscription_id === javascriptFile.current.subscriptionId) {
                    javascriptFile.current.subscriptionId = undefined;
                    javascriptFile.current.data = undefined;
                    javascriptFile.current.metadata = undefined;
                }
            }
            if (TERMINATE) {
                blockerId.current = blocker_id;
                globalThis.CK_ADAPTER.pushWorkload({
                    default: [{
                        type: "worker",
                        receiver: {
                            instance_id: "ASSET_SERVER",
                            modality: "wasmjs",
                            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServer`,
                        },
                        payload: {
                            unsubscribeFromAsset: {
                                asset_id: "index",
                                subscription_id: index.current.subscriptionId,
                            }
                        },
                    }]
                });
            }
            if (unsubscribeConfirmation) {
                const { subscription_id } = unsubscribeConfirmation;
                if (subscription_id === index.current.subscriptionId) {
                    index.current.subscriptionId = undefined;
                }
                if (subscription_id === javascriptFile.current.subscriptionId) {
                    javascriptFile.current.subscriptionId = undefined;
                    javascriptFile.current.data = undefined;
                    javascriptFile.current.metadata = undefined;
                }
            }
        }

        if (state === "open_editor") {
            const { TERMINATE, unsubscribeConfirmation, blocker_id, deleteNotification } = payload;
            if (TERMINATE) {
                blockerId.current = blocker_id;
                globalThis.CK_ADAPTER.pushWorkload({
                    default: [{
                        type: "worker",
                        receiver: {
                            instance_id: "ASSET_SERVER",
                            modality: "wasmjs",
                            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServer`,
                        },
                        payload: {
                            unsubscribeFromAsset: {
                                asset_id: "index",
                                subscription_id: index.current.subscriptionId,
                            }
                        },
                    }]
                });
            }
            if (unsubscribeConfirmation) {
                const { subscription_id } = unsubscribeConfirmation;
                if (subscription_id === index.current.subscriptionId) {
                    setState("ready_for_termination");
                }
            }
            if (deleteNotification) {
                const { subscription_id } = deleteNotification;
                if (subscription_id === javascriptFile.current.subscriptionId) {
                    setState("lobby");
                }
            }
        }

        if (state === "ready_for_termination") {
            if (blockerId.current === undefined) {
                throw new Error("Blocker ID is undefined");
            }
            globalThis.CK_ADAPTER.pushWorkload({
                default: [{
                    type: "blocker",
                    blocker_id: blocker_id.current,
                    id: crypto.randomUUID(),
                    blocker_count: 2,
                }]
            })
        }



        const { blocker_id } = payload;

        blockerId.current = blocker_id;


        index.current = useAssetIndex(unit);
        javascriptFile.current = useJavascriptFile(unit,index,fileReady,setFileReady,setJavascriptFile);

        if (
            index.current.readyForTermination
            && javascriptFile.current.readyForTermination
        ) {

        }

    })

    if (!initialised) {
        return <FullscreenLoader />
    }

    if (!fileReady) {
        return <div>No file found for editing</div>
    }

    return <div>{javascriptFile}</div>
}


export default CodeEditor;