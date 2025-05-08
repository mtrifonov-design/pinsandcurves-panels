import { SubscriptionFSM, FSMState } from "./SubscriptionFSM";

type Snapshot = Record<string, ReturnType<SubscriptionFSM["getSnapshot"]>>;

type Listener = () => void;

export class SubscriptionManager {
    /* ——————————————————— private ——————————————————— */
    fsms = new Map<string, SubscriptionFSM>();
    #listeners = new Set<Listener>();
    #snapshot: Snapshot = {};           // immutable object for React
    #initialized = false;  // true when we receive INIT event from server
    #unrealized_desired: { assetId: string; assetController: unknown }[]; // unrealized desired assets

    /* ——————————————————— public API ——————————————————— */

    /** Desired asset list (called by useAssets each render) */
    #current_desired_ids : string[] | undefined = undefined;
    setDesired(desired: { assetId: string; assetController: unknown }[]) {
        if (!this.#initialized) {
            this.#unrealized_desired = desired;
            return;
        }; // ignore until INIT

        const desiredIds = new Set(desired.map(d => d.assetId));
        this.#current_desired_ids = Array.from(desiredIds);

        /* 1️⃣ close FSMs that are no longer wanted */
        this.fsms.forEach((fsm, id) => {
            if (!desiredIds.has(id)) fsm.unsubscribe();
        });

        /* 2️⃣ create FSMs for newly desired assets */
        desired.forEach(({ assetId, assetController }) => {
            if (!this.fsms.has(assetId)) {
                const fsm = new SubscriptionFSM(assetController, this);
                this.fsms.set(assetId, fsm);
                fsm.subscribe(assetId);
            }
        });
    }


    /** React 18 external‑store bindings */
    subscribe = (listener: Listener) => {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    };
    getSnapshot = () => this.#snapshot;

    /** INIT event from server */
    handleInit() {
        this.#initialized = true;
        this.updateSnapshot(true);
        this.setDesired(this.#unrealized_desired);
        this.#listeners.forEach(l => l());
    }

    async handleTerminate() {
        await new Promise(resolve => {
            if (this.fsms.size === 0) {
                resolve(true);
                return;
            }
            const listener = () => {
                const fsmsArray = Array.from(this.fsms.values());
                if (fsmsArray.filter(fsm => fsm.isDone() !== true).length === 0) {
                    this.#listeners.delete(listener);
                    // this.fsms.clear();
                    // this.#snapshot = { snapshotId: crypto.randomUUID() }; // force React to re-render

                    //////console.log("SubscriptionManager: TERMINATE COMPLTED",)
                    resolve(true);
                }
            };
            this.#listeners.add(listener);
            this.fsms.forEach(fsm => fsm.unsubscribe());
        });
    }

    handleEvent(sender: any, payload: any) {
        const {
            receiveUpdate,
            subscriptionConfirmation,
            unsubscribeConfirmation,
            getAssetResponse,
            deleteNotification,
            receiveMetadataUpdate,
        } = payload;

        if (subscriptionConfirmation) {
            const { subscription_id, subscription_name, asset_id } = subscriptionConfirmation;
            const fsm = Array.from(this.fsms.values()).find(fsm => fsm.subName === subscription_name);
            if (!fsm) {
                return;
            }
            fsm.dispatch({ type: "SUBSCRIBE_CONFIRMED", subId: subscription_id, assetId: asset_id });
        } else {
            const universalSubId = [receiveUpdate, unsubscribeConfirmation, getAssetResponse, deleteNotification]
                .filter((el: any) => el !== undefined)
                .map((el: any) => el.subscription_id)[0];
            const fsm = Array.from(this.fsms.values()).find(fsm => fsm.subId === universalSubId);
            if (!fsm) { return; }

            if (receiveUpdate) fsm.dispatch({ type: "RECEIVE_UPDATE", update: receiveUpdate.update });
            if (unsubscribeConfirmation) fsm.dispatch({ type: "UNSUBSCRIBE_CONFIRMED" });
            if (getAssetResponse) fsm.dispatch({ type: "ASSET_DATA", data: getAssetResponse.asset_data });
            if (deleteNotification) fsm.dispatch({ type: "DELETE_NOTIFICATION" });
            if (receiveMetadataUpdate) fsm.dispatch({ type: "RECEIVE_METADATA_UPDATE", metadata: receiveMetadataUpdate.metadata });

            // if (fsm.isDone()) {
            //     this.fsms.delete(fsm.assetId);
            //     this.updateSnapshot();
            // }
        }
    }

    updateSnapshot(force = false) {
        const next: Snapshot = {};
        for (const [id, fsm] of this.fsms) next[id] = fsm.getSnapshot();
        const { snapshotId, ...rest } = this.#snapshot;
        if (shallowEqual(next, rest) && !force) return;  // nothing changed
        this.#snapshot = { ...next, snapshotId: crypto.randomUUID() }; // force React to re-render
        this.#listeners.forEach(l => l());
    }

    getAssetPresentation() {
        if (!this.#initialized) return {
            initialized: false,
        }

        const currentDesiredIds = this.#current_desired_ids;
        console.log("currentDesiredIds", currentDesiredIds)
        if (currentDesiredIds === undefined) {
            return {
                initialized: false,
            }
        }

        const result: Record<string, any> = {};

        for (const id of currentDesiredIds) {
            const fsm = this.fsms.get(id);
            if (!fsm) {
                return {
                    initialized: false,
                }
            }
            if (fsm.isDone()) {
                throw new Error(`AssetManager: getAssetPresentation: assetId ${id} has been terminated`);
            }
            if (fsm.assetController === undefined) {
                throw new Error(`AssetManager: getAssetPresentation: assetId ${id} has no controller`);
            }
            if (fsm.initialised() === false) {
                return {
                    initialized: false,
                }
            }
            result[id] = fsm.assetController;
        }


        //console.log(currentDesiredIds)

        // const uninitializedAssets = Array.from(this.fsms.values()).filter(fsm => !fsm.initialised());
        // if (uninitializedAssets.length > 0) {
        //     return {
        //         initialized: false,
        //     }
        // }
        // const result: Record<string, any> = {};
        // this.fsms.forEach((fsm, id) => {
        //     result[id] = fsm.assetController;
        // });
        //console.log("SubscriptionManager: getAssetPresentation", result);
        return {
            initialized: true,
            assets: result,
        };
    }


}

/* Helpers */
function shallowEqual(a: object, b: object) {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every(k => (a as any)[k] === (b as any)[k]);
}
