import { CK_Circuit } from "../CK_Adapter/CK_Circuit";
import { RegisterUnitProcessor } from "../CK_Adapter/CK_UnitProvider";
import { CK_Workload } from "../CK_Adapter/types";
import { Asset, AssetController } from "./Asset";

export interface AssetRegistry {
    [assetId: string]: AssetController;
}

export interface AssetDiff {
    in: { assetId: string; assetController: AssetController }[];
    out: { assetId: string; assetController: AssetController }[];
}

export type AssetMap = Record<string, Asset>;

export type Subscriber = () => void;

export class SubscriptionManager {
    constructor(
        private FreeWorkload: () => CK_Workload,
        private registerUnitProcessor: RegisterUnitProcessor
    ) {}

    assetRegistry: AssetRegistry = {};
    diffSubmissionRunning = false;
    diffSubmissionQueue: AssetDiff[] = [];
    async submitAssetIdDiffs(diffs: AssetDiff) {
        this.diffSubmissionQueue.push(diffs);
        if (this.diffSubmissionRunning) return;
        this.diffSubmissionRunning = true;
        while (this.diffSubmissionQueue.length > 0) {
            const currentDiffs = this.diffSubmissionQueue.shift();
            if (currentDiffs) {
                if (this.terminated) return;
                const { in: inIds, out: outIds } = currentDiffs;
                outIds.forEach(({ assetId }) => delete this.assetRegistry[assetId]);
                inIds.forEach(({ assetId, assetController }) => {
                    this.assetRegistry[assetId] = assetController;
                });
                const w = this.FreeWorkload();
                const c = new CK_Circuit(this.registerUnitProcessor, w);
                await this.syncAssets(c);
                c.complete();
                this.notifySubscribers();
            }
        }
        this.diffSubmissionRunning = false;
    }

    private initialized = false;
    private terminated = false;
    private vertexId!: string;
    assets: AssetMap = {};
    private subscribers: Subscriber[] = [];

    async init(vertexId: string, c: CK_Circuit) {
        this.initialized = true;
        this.vertexId = vertexId;
        await this.syncAssets(c);
        this.notifySubscribers();
    }

    async terminate(c: CK_Circuit) {
        this.terminated = true;
        for (const asset of Object.values(this.assets)) {
            console.log("Unsubscribing from asset", asset);
            await asset.unsubscribe(c);
        }
        this.assets = {};
        this.notifySubscribers();
    }

    private async syncAssets(c: CK_Circuit) {
        if (!this.initialized) return;
        console.log("Syncing assets", this.assets, this.assetRegistry);
        const unusedAssets = Object.keys(this.assets).filter(
            (id) => !Object.keys(this.assetRegistry).includes(id)
        );
        for (const id of unusedAssets) {
            await this.assets[id].unsubscribe(c);
            delete this.assets[id];
        }
        const newAssets = Object.keys(this.assetRegistry).filter(
            (id) => !this.assets[id]
        );
        console.log("New assets to subscribe", newAssets);
        for (let i = 0; i < newAssets.length; i++) {
            const id = newAssets[i];
            const controller = this.assetRegistry[id];
            const asset = await Asset.subscribe(
                this.vertexId,
                id,
                controller,
                c,
                this.registerUnitProcessor,
                this.notifySubscribers.bind(this),
                this.FreeWorkload
            );
            console.log("Subscribed to new asset", id, asset);
            this.assets[id] = asset;
        }
    }

    subscribe(cb: Subscriber) {
        this.subscribers.push(cb);
        return () => {
            this.subscribers = this.subscribers.filter((sub) => sub !== cb);
        };
    }
    getSnapshot(): AssetMap {
        return this.assets;
    }

    notifySubscribers() {
        this.assets = { ...this.assets };
        this.subscribers.forEach((cb) => cb());
    }
}

