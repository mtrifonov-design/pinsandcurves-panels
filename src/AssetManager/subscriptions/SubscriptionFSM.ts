import CONFIG from "../../Config";

function sendToAssetServer(payload: any) {
    CK_ADAPTER.pushWorkload({
        default: [{
            type: "worker",
            receiver: {
                instance_id: "ASSET_SERVER",
                modality: "wasmjs",
                resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
            },
            payload,
        }],
    });
}

/** Finite‑state machine for ONE asset subscription */
export enum FSMState {
    IDLE = "IDLE",            // not yet subscribed
    SUBSCRIBING = "SUBSCRIBING",
    ACTIVE = "ACTIVE",        // receiving updates
    CLOSING = "CLOSING",      // sent unsubscribe, waiting confirm
    DONE = "DONE",            // safe to GC
}

export type FSMEvent =
    | { type: "CREATE", subName: string, asset: any }
    | { type: "SUBSCRIBE_TO_EXISTING", subName: string, assetId: string }
    | { type: "SUBSCRIBE_CONFIRMED"; subId: string, assetId: string }
    | { type: "ASSET_DATA"; data: unknown }
    | { type: "RECEIVE_UPDATE"; update: unknown }
    | { type: "UPDATE"; update: unknown }
    | { type: "UPDATE_METADATA"; metadata: unknown }
    | { type: "RECEIVE_METADATA_UPDATE"; metadata: unknown }
    | { type: "DELETE"; }
    | { type: "UNSUBSCRIBE" }
    | { type: "DELETE_NOTIFICATION" }
    | { type: "UNSUBSCRIBE_CONFIRMED" };

export class SubscriptionFSM {
    assetId?: string;
    private state: FSMState = FSMState.IDLE;
    subId?: string;
    subName?: string;
    assetController: unknown;
    manager?: unknown;

    constructor(controller: unknown, manager?: unknown) {
        this.manager = manager;
        this.assetController = controller;
        this.assetController.setHooks({
            create: this.create.bind(this),
            subscribe: this.subscribe.bind(this),
            delete: this.delete.bind(this),
            update: this.update.bind(this),
            updateMetadata: this.updateMetadata.bind(this),
            unsubscribe: this.unsubscribe.bind(this),
        })
    }

    initialised() {
        return this.state === FSMState.ACTIVE;
    }

    detachFromManager() {
        this.manager.fsms.delete(this.assetId);
    }

    notifyManager() {
        if (this.manager) {
            this.manager.updateSnapshot();
        }
    }

    /** Drive state transitions */
    dispatch(ev: FSMEvent) {
        switch (this.state) {
            case FSMState.IDLE:
                if (ev.type === "SUBSCRIBE_TO_EXISTING") {
                    this.subName = ev.subName;
                    this.assetId = ev.assetId;
                    sendToAssetServer({
                        subscribeToExistingAsset: {
                            asset_id: this.assetId,
                            subscription_name: this.subName,
                        }
                    })
                    this.state = FSMState.SUBSCRIBING;

                }
                if (ev.type === "CREATE") {
                    this.subName = ev.subName;
                    this.assetController.load(ev.asset);
                    sendToAssetServer({
                        createAsset: ev.asset,
                    });
                    this.state = FSMState.SUBSCRIBING;
                }
                break;

            case FSMState.SUBSCRIBING:
                if (ev.type === "SUBSCRIBE_CONFIRMED") {
                    this.subId = ev.subId;
                    this.assetId = ev.assetId;
                }
                if (ev.type === "ASSET_DATA") {
                    //console.log("ASSET_DATA", ev.data,this.assetId);
                    this.assetController.load(ev.data);
                    this.state = FSMState.ACTIVE;
                    this.notifyManager();
                }
                break;

            case FSMState.ACTIVE:
                switch (ev.type) {
                    case "RECEIVE_UPDATE":
                        this.assetController.receiveUpdate(ev.update);
                        this.notifyManager();
                        break;
                    case "UPDATE":
                        sendToAssetServer({
                            updateAsset: {
                                subscription_id: this.subId,
                                asset_id: this.assetId,
                                update: ev.update,
                            }
                        });
                        this.notifyManager();
                        break;
                    case "UPDATE_METADATA":
                        sendToAssetServer({
                            updateAssetMetadata: {
                                subscription_id: this.subId,
                                asset_id: this.assetId,
                                metadata: ev.metadata,
                            }
                        });
                        this.notifyManager();
                        break;
                    case "RECEIVE_METADATA_UPDATE":
                        this.assetController.receiveMetadataUpdate(ev.metadata);
                        this.notifyManager();
                        break;
                    case "DELETE_NOTIFICATION":
                        this.state = FSMState.DONE;
                        this.detachFromManager();
                        this.assetController.destroy();
                        this.notifyManager();
                        break;
                    case "UNSUBSCRIBE":
                        this.state = FSMState.CLOSING;
                        sendToAssetServer({
                            unsubscribeFromAsset: {
                                subscription_id: this.subId,
                                asset_id: this.assetId,
                            }
                        });
                        this.notifyManager();
                        break;
                    case "DELETE":
                        this.state = FSMState.DONE;
                        this.notifyManager();
                        break;

                }
                break;
            case FSMState.CLOSING:
                if (ev.type === "UNSUBSCRIBE_CONFIRMED") {
                    this.state = FSMState.DONE;
                    //this.detachFromManager();
                    this.assetController.destroy();
                    this.notifyManager();
                }
                if (ev.type === "DELETE_NOTIFICATION") {
                    this.state = FSMState.DONE;
                    this.detachFromManager();
                    this.assetController.destroy();
                    this.notifyManager();
                }
                break;
            case FSMState.DONE:
                break;
        }
    }

    /** True when FSM reached a terminal state */
    isDone() {
        return this.state === FSMState.DONE;
    }

    /** Data exposed to React via manager.getSnapshot() */
    getSnapshot() {
        return this.assetController.getSnapshot();
    }

    create(asset: any) {
        this.subName = crypto.randomUUID();
        this.dispatch({ type: "CREATE", subName: this.subName, asset: asset });
    }
    subscribe(assetId: string) { 
        this.subName = crypto.randomUUID();
        this.dispatch({ type: "SUBSCRIBE_TO_EXISTING", subName: this.subName, assetId: assetId });
    }
    delete() { 
        this.dispatch({ type: "DELETE" });
    }
    update(update: any) { 
        this.dispatch({ type: "UPDATE", update: update });
    }
    updateMetadata(metadata: any) { 
        this.dispatch({ type: "UPDATE_METADATA", metadata: metadata });
    }
    unsubscribe() { 
        this.dispatch({ type: "UNSUBSCRIBE" });
    }
}
