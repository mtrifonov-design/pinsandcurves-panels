import { CK_Workload } from "../../CK_Adapter/types";
import CONFIG from "../../Config";

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
    | { type: "SUBSCRIBE_TO_EXISTING", subId: string, assetId: string }
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
    currentWorkload: CK_Workload | undefined = undefined;
    setCurrentWorkload(workload: CK_Workload) {
        this.currentWorkload = workload;
    }

    sendToAssetServer(payload: any, free: boolean = false) {
        const workload = free ? this.FreeWorkload() : this.currentWorkload;
        if (!workload) {
            throw new Error("No current workload set");
        }
        const instance = {
            instance_id: "ASSET_SERVER",
            modality: "wasmjs",
            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
        }
        if (payload !== undefined) workload.thread("default").worker(instance,payload);
        if (free) workload.dispatch();
    }

    FreeWorkload: () => CK_Workload;
    vertexId: string = "";
    constructor(controller: unknown, FreeWorkload: () => CK_Workload, manager?: unknown) {
        this.FreeWorkload = FreeWorkload;   
        this.manager = manager;
        this.vertexId = manager?.vertexId || "";
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
                    this.subId = ev.subId;
                    this.assetId = ev.assetId;
                    this.sendToAssetServer({
                        subscribeToExistingAsset: {
                            asset_id: this.assetId,
                            subscription_id: this.subId,
                        }
                    },true)
                    this.state = FSMState.SUBSCRIBING;

                }
                if (ev.type === "CREATE") {
                    this.subName = ev.subName;
                    this.assetController.load(ev.asset);
                    this.sendToAssetServer({
                        createAsset: ev.asset,
                    },true);
                    this.state = FSMState.SUBSCRIBING;
                }
                break;

            case FSMState.SUBSCRIBING:
                if (ev.type === "SUBSCRIBE_CONFIRMED") {
                    this.subId = ev.subId;
                    this.assetId = ev.assetId;
                    this.sendToAssetServer();
                }
                if (ev.type === "ASSET_DATA") {
                    ////console.log("ASSET_DATA", ev.data,this.assetId);
                    this.assetController.load(ev.data);
                    this.state = FSMState.ACTIVE;
                    this.notifyManager();
                    this.sendToAssetServer();
                }
                break;

            case FSMState.ACTIVE:
                switch (ev.type) {
                    case "RECEIVE_UPDATE":
                        this.assetController.receiveUpdate(ev.update);
                        this.notifyManager();
                        this.sendToAssetServer();
                        break;
                    case "UPDATE":
                        this.sendToAssetServer({
                            updateAsset: {
                                subscription_id: this.subId,
                                asset_id: this.assetId,
                                update: ev.update,
                            }
                        },true);
                        this.notifyManager();
                        break;
                    case "UPDATE_METADATA":
                        this.sendToAssetServer({
                            updateAssetMetadata: {
                                subscription_id: this.subId,
                                asset_id: this.assetId,
                                metadata: ev.metadata,
                            }
                        },true);
                        this.notifyManager();
                        break;
                    case "RECEIVE_METADATA_UPDATE":
                        this.assetController.receiveMetadataUpdate(ev.metadata);
                        this.notifyManager();
                        this.sendToAssetServer();
                        break;
                    case "DELETE_NOTIFICATION":
                        this.state = FSMState.DONE;
                        this.detachFromManager();
                        this.assetController.destroy();
                        this.notifyManager();
                        this.sendToAssetServer();
                        break;
                    case "UNSUBSCRIBE":
                        this.state = FSMState.CLOSING;
                        this.sendToAssetServer({
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
                    //console.log("UNSUBSCRIBE_CONFIRMED", this.assetId, this.cb_fsm);
                    this.assetController.destroy();
                    if (this.cb_fsm) this.cb_fsm(this);
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
        // should be deprecated 
        this.subName = crypto.randomUUID();
        this.dispatch({ type: "CREATE", subName: this.subName, asset: asset });
    }
    subscribe(assetId: string) { 
        this.subId = this.vertexId + "_" + assetId;
        //console.log("subscribe", this.subId, assetId);
        this.dispatch({ type: "SUBSCRIBE_TO_EXISTING", subId: this.subId, assetId: assetId });
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

    cb_fsm : ((self:any) => void) | undefined = undefined;
    unsubscribe(cb_fsm?: (self:any) => void) { 
        //console.log("unsubscribe", this.assetId, cb_fsm);
        if (cb_fsm) this.cb_fsm = cb_fsm;
        this.dispatch({ type: "UNSUBSCRIBE" });
    }
}
