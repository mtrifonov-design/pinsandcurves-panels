import { CK_Workload } from "../../CK_Adapter/types";

class Asset {}

export class SubscriptionManager {
    assetIds: Set<string> = new Set();
    async submitAssetIdDiffs(diffs: {
        in: string[];
        out: string[];
    }) {
        if (this.terminated) return;
        const { in: inIds, out: outIds } = diffs;
        outIds.forEach(id => this.assetIds.delete(id));
        inIds.forEach(id => this.assetIds.add(id));
        await this.syncAssets();
        this.notifySubscribers();
    }

    private initialized = false;
    private terminated = false;
    async init(vertexId: string) {
        this.initialized = true;
        this.vertexId = vertexId;
        // Initialize assets based on the current assetIds
        await this.syncAssets();
        this.notifySubscribers();
    }

    async terminate() {
        this.terminated = true;
        // Unsubscribe from all assets
        for (const asset of Object.values(this.assets)) {
            await asset.unsubscribe();
        }
        this.assets = {};
        this.notifySubscribers();
    }

    private vertexId: string;
    assets: Record<string, Asset> = {};
    private async syncAssets() {
        if (!this.initialized) return;
        // sync the assetIds with the actual assets
        // 1. Identify assets that are no longer used
        const unusedAssets = Object.keys(this.assets).filter(id => !this.assetIds.has(id));
        for (const id of unusedAssets) {
            // Unsubscribe from the asset and remove it from the assets map
            await this.assets[id].unsubscribe();
            delete this.assets[id];
        }

        // 2. Identify assets that are newly used
        const newAssets = Array.from(this.assetIds).filter(id => !this.assets[id]);
        for (const id of newAssets) {
            // Create a new asset instance and add it to the assets map
            this.assets[id] = await Asset.subscribe(this.vertexId,id); // Assuming Asset has a constructor that initializes it
        }
    }

    private subscribers = [];
    subscribe(cb: () => void) {
        this.subscribers.push(cb);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== cb);
        };
    }
    getSnapshot() {
        return this.assets;
    }
    notifySubscribers() {
        this.subscribers.forEach(cb => cb());
    }
}
