import { CK_Circuit } from "../CK_Adapter/CK_Circuit";
import { RegisterUnitProcessor } from "../CK_Adapter/CK_UnitProvider";
import { CK_Workload } from "../CK_Adapter/types";
import CONFIG from "../Config";

export class Asset {

    initialized = false;
    constructor(private assetId: string, private subscriptionId: string,public controller: unknown, public notifySubscribers: () => void, public FreeWorkload : () => CK_Workload) {
        const instance= {
            instance_id: "ASSET_SERVER",
            modality: "wasmjs",
            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
        }
        this.controller.setHooks({
            update: (update) => {
                const w = this.FreeWorkload();
                w.thread("default").worker(instance, {
                    updateAsset: {
                        asset_id: this.assetId,
                        subscription_id: this.subscriptionId,
                        update: update,
                }});
                w.dispatch();
            },
            updateMetadata: (metadata) => {
                const w = this.FreeWorkload();
                w.thread("default").worker(instance, {
                    updateAssetMetadata: {
                        asset_id: this.assetId,
                        subscription_id: this.subscriptionId,
                        metadata: metadata,
                }});
                w.dispatch();
            },
        });
    }
    async unsubscribe(c: CK_Circuit): Promise<void> {
        const instance = {
            instance_id: "ASSET_SERVER",
            modality: "wasmjs",
            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
        }
        await c.instance(instance).call("unsubscribe", {
            subscription_id: this.subscriptionId,
        })
        
    }

    unsubscribeSync: any;
    static async subscribe(vertexId: string, assetId: string, controller: unknown, 
        c: CK_Circuit,registerUnitProcessor: RegisterUnitProcessor, notifySubscribers: () => void, FreeWorkload: () => CK_Workload): Promise<Asset> {
        const instance = {
            instance_id: "ASSET_SERVER",
            modality: "wasmjs",
            resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
        }
        const subscriptionId = `${vertexId}_${assetId}`;
        console.log(`Subscribing to asset ${assetId} with subscription ID ${subscriptionId}`);
        const a = new Asset(assetId, subscriptionId,controller,notifySubscribers,FreeWorkload);
        a.unsubscribeSync = registerUnitProcessor(
            unit => {
                const isWorker = unit.type === "worker";
                if (!isWorker) return false;
                const { receiveUpdate, receiveMetadataUpdate, getAssetResponse } = unit.payload;
                const optionA = receiveUpdate ? receiveUpdate.subscription_id === a.subscriptionId : false;
                const optionB = receiveMetadataUpdate ? receiveMetadataUpdate.subscription_id === a.subscriptionId : false;
                const optionC = getAssetResponse ? getAssetResponse.asset_id === assetId : false;
                return optionA || optionB || optionC;   
            },
            (unit,workload) => {
                console.log(`Received update for asset ${assetId}`, unit.payload);
                if (unit.payload.receiveUpdate) {
                    const update = unit.payload.receiveUpdate.update;
                    controller.receiveUpdate(update);
                    // Handle the update logic here
                } else if (unit.payload.receiveMetadataUpdate) {
                    const metadataUpdate = unit.payload.receiveMetadataUpdate.metadata;
                    controller.receiveMetadataUpdate(metadataUpdate);
                    // Handle the metadata update logic here
                } else if (unit.payload.getAssetResponse) {
                    const assetData = unit.payload.getAssetResponse.asset_data;
                    a.initialized = true;
                    controller.load(assetData);
                }
                notifySubscribers();
                workload.dispatch();
            }
        )
        await c.instance(instance).call("subscribeToExistingAsset", {
            asset_id: assetId,
            subscription_id: subscriptionId,
        })
        console.log(`Subscribed to asset ${assetId} with subscription ID ${subscriptionId}`);
        return a;
    }




}

export class SubscriptionManager {

    constructor(private FreeWorkload: () => CK_Workload, private registerUnitProcessor: RegisterUnitProcessor) {}


    assetRegistry : { [assetId: string]: unknown;} = {};
    diffSubmissionRunning = false;
    diffSubmissionQueue : {
        in: {assetId: string, assetController: unknown}[];
        out: {assetId: string, assetController: unknown}[];
    }[] = [];
    async submitAssetIdDiffs(diffs: {
        in: {assetId: string, assetController: unknown}[];
        out: {assetId: string, assetController: unknown}[];
    }) {
        console.log("Submitting asset ID diffs:", diffs);
        this.diffSubmissionQueue.push(diffs);
        if (this.diffSubmissionRunning) return;
        this.diffSubmissionRunning = true;
        while (this.diffSubmissionQueue.length > 0) {
            const currentDiffs = this.diffSubmissionQueue.shift();
            console.log("Processing asset ID diffs:", JSON.stringify(currentDiffs,null,2));
            if (currentDiffs) {
                if (this.terminated) return;
                const { in: inIds, out: outIds } = currentDiffs;
                outIds.forEach(({assetId}) => delete this.assetRegistry[assetId]);
                console.log("IN IDS", JSON.stringify(inIds,null,2));
                inIds.forEach(({assetId, assetController}) => {this.assetRegistry[assetId] = assetController});
                const w = this.FreeWorkload();
                const c = new CK_Circuit(this.registerUnitProcessor, w);
                await this.syncAssets(c);
                c.complete();
                console.log("SYNC ASSETS COMPLETED");
                this.notifySubscribers();
            }
        }
        this.diffSubmissionRunning = false;
    }

    private initialized = false;
    private terminated = false;
    async init(vertexId: string, c: CK_Circuit) {
        this.initialized = true;
        this.vertexId = vertexId;
        // Initialize assets based on the current assetIds
        await this.syncAssets(c);

        this.notifySubscribers();
    }

    async terminate(c: CK_Circuit) {
        this.terminated = true;
        // Unsubscribe from all assets
        for (const asset of Object.values(this.assets)) {
            await asset.unsubscribe(c);
        }
        this.assets = {};
        this.notifySubscribers();
    }

    private vertexId: string;
    assets: Record<string, Asset> = {};
    private async syncAssets(c: CK_Circuit) {
        if (!this.initialized) return;

        console.log("ASSET REGISTRY", JSON.stringify(this.assetRegistry,null,2));
        console.log("Current assets:", JSON.stringify(this.assets,null,2));

        // sync the assetIds with the actual assets
        // 1. Identify assets that are no longer used
        const unusedAssets = Object.keys(this.assets).filter(id => !Object.keys(this.assetRegistry).includes(id));
        for (const id of unusedAssets) {
            // Unsubscribe from the asset and remove it from the assets map
            await this.assets[id].unsubscribe(c);
            delete this.assets[id];
        }

        // 2. Identify assets that are newly used
        console.log("KEYS OF ASSET REGISTRY", Object.keys(this.assetRegistry));
        const newAssets = Object.keys(this.assetRegistry).filter(id => !this.assets[id]);
        console.log("New assets to subscribe to:", JSON.stringify(newAssets,null,2));
        for (let i = 0; i < newAssets.length; i++) {
            const id = newAssets[i];
            // Create a new asset instance and add it to the assets map
            console.log(`Subscribing to new asset ${id}`);
            const controller = this.assetRegistry[id];
            const asset = await Asset.subscribe(this.vertexId,id,controller,c,this.registerUnitProcessor,this.notifySubscribers.bind(this),this.FreeWorkload); // Assuming Asset has a constructor that initializes it
            console.log(id, "subscribed", asset);
            this.assets[id] = asset;
        }
        console.log("Current assets after sync:", JSON.stringify(this.assets,null,2));

    }

    private subscribers = [];
    subscribe(cb: () => void) {
        this.subscribers.push(cb);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== cb);
        };
    }
    getSnapshot() {
        return this.assets
    }

    notifySubscribers() {
        console.log("Notifying subscribers of asset updates");
        this.assets = {...this.assets}; // Ensure assets are up-to-date
        this.subscribers.forEach(cb => cb());
    }
}

