import { CK_Circuit } from "../CK_Adapter/CK_Circuit";
import { RegisterUnitProcessor } from "../CK_Adapter/CK_UnitProvider";
import { CK_Workload } from "../CK_Adapter/types";
import CONFIG from "../Config";

export interface AssetController {
    setHooks(hooks: {
        update: (update: unknown) => void;
        updateMetadata: (metadata: unknown) => void;
    }): void;
    receiveUpdate(update: unknown): void;
    receiveMetadataUpdate(metadata: unknown): void;
    load(assetData: unknown): void;
}

export class Asset {
    initialized = false;
    constructor(
        private assetId: string,
        private subscriptionId: string,
        public controller: AssetController,
        public notifySubscribers: () => void,
        public FreeWorkload: () => CK_Workload
    ) {
        const instance = {
            instance_id: "ASSET_SERVER",
            modality: "wasmjs",
            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
        };
        this.controller.setHooks({
            update: (update) => {
                const w = this.FreeWorkload();
                w.thread("default").worker(instance, {
                    updateAsset: {
                        asset_id: this.assetId,
                        subscription_id: this.subscriptionId,
                        update: update,
                    },
                });
                w.dispatch();
            },
            updateMetadata: (metadata) => {
                const w = this.FreeWorkload();
                w.thread("default").worker(instance, {
                    updateAssetMetadata: {
                        asset_id: this.assetId,
                        subscription_id: this.subscriptionId,
                        metadata: metadata,
                    },
                });
                w.dispatch();
            },
        });
    }
    async unsubscribe(c: CK_Circuit): Promise<void> {
        const instance = {
            instance_id: "ASSET_SERVER",
            modality: "wasmjs",
            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
        };
        await c.instance(instance).call("unsubscribeFromAsset", {
            asset_id: this.assetId,
            subscription_id: this.subscriptionId,
        });
    }

    unsubscribeSync: unknown;
    static async subscribe(
        vertexId: string,
        assetId: string,
        controller: AssetController,
        c: CK_Circuit,
        registerUnitProcessor: RegisterUnitProcessor,
        notifySubscribers: () => void,
        FreeWorkload: () => CK_Workload
    ): Promise<Asset> {
        const instance = {
            instance_id: "ASSET_SERVER",
            modality: "wasmjs",
            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
        };
        const subscriptionId = `${vertexId}_${assetId}`;
        const a = new Asset(assetId, subscriptionId, controller, notifySubscribers, FreeWorkload);
        a.unsubscribeSync = registerUnitProcessor(
            (unit) => {
                const isWorker = unit.type === "worker";
                if (!isWorker) return false;
                const { receiveUpdate, receiveMetadataUpdate, getAssetResponse } = unit.payload;
                const optionA = receiveUpdate ? receiveUpdate.subscription_id === a.subscriptionId : false;
                const optionB = receiveMetadataUpdate ? receiveMetadataUpdate.subscription_id === a.subscriptionId : false;
                const optionC = getAssetResponse ? getAssetResponse.asset_id === assetId : false;
                return optionA || optionB || optionC;
            },
            (unit, workload) => {
                if (unit.payload.receiveUpdate) {
                    const update = unit.payload.receiveUpdate.update;
                    controller.receiveUpdate(update);
                } else if (unit.payload.receiveMetadataUpdate) {
                    const metadataUpdate = unit.payload.receiveMetadataUpdate.metadata;
                    controller.receiveMetadataUpdate(metadataUpdate);
                } else if (unit.payload.getAssetResponse) {
                    const assetData = unit.payload.getAssetResponse.asset_data;
                    a.initialized = true;
                    controller.load(assetData);
                }
                notifySubscribers();
                workload.dispatch();
            }
        );
        console.log("Subscribing to asset", assetId, subscriptionId,c);
        await c.instance(instance).call("subscribeToExistingAsset", {
            asset_id: assetId,
            subscription_id: subscriptionId,
        });
        console.log("Instance Call Successful");
        return a;
    }
}
