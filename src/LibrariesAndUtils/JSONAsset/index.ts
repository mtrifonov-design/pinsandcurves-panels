type JSONAssetData = {
    [key:string]: any;
}

class JSONAsset {
    data: JSONAssetData;
    constructor(data : JSONAssetData) {
        this.data = data;
    }

    setData(data : JSONAssetData) {
        this.data = data;
        //this.#notifyInternalSubscribers();
        this.#notifyExternalSubscribers();
    }

    externalState: string = crypto.randomUUID();
    receiveExternalUpdate(update : JSONAssetData) {
        this.data = update
        this.externalState = crypto.randomUUID();
        this.#notifyExternalStateSubscribers();
        this.#notifyInternalSubscribers();
    }

    #externalStateSubscribers: Array<() => void> = [];
    subscribeToExternalState(cb: () => void) {
        this.#externalStateSubscribers.push(cb);
        return () => {
            this.#externalStateSubscribers = this.#externalStateSubscribers.filter((c) => c !== cb);
        }
    }
    #notifyExternalStateSubscribers() {
        this.#externalStateSubscribers.forEach((cb) => cb());
    }
    getExternalState() {
        return this.externalState;
    }

    #internalSubscribers: Array<() => void> = [];
    subscribeInternal(cb: () => void) {
        this.#internalSubscribers.push(cb);
        return () => {
            this.#internalSubscribers = this.#internalSubscribers.filter((c) => c !== cb);
        }
    }
    #notifyInternalSubscribers() {
        console.log("Internal subscribers count:", this.#internalSubscribers);
        this.#internalSubscribers.forEach((cb) => cb());
    }

    #externalSubscribers: Array<() => void> = [];
    subscribeExternal(cb: () => void ) {
        this.#externalSubscribers.push(cb);
        return () => {
            this.#externalSubscribers = this.#externalSubscribers.filter((c) => c !== cb);
        }
    }
    #notifyExternalSubscribers() {
        this.#externalSubscribers.forEach((cb) => cb());
    }

    getSnapshot() {
        return this.data;
    }
}

export default class Controller {
    initialised = false
    data?: JSONAsset;
    constructor() {}
    load(data: JSONAssetData) {
        this.data = new JSONAsset(data);
        this.data.subscribeExternal(() => {
            const update = this.data?.getSnapshot();
            if (update) this.update(update);
        })
        this.initialised = true;
    }
    receiveUpdate(update: JSONAssetData) {
        this.data?.receiveExternalUpdate(update);
    }
    receiveMetadataUpdate() {}
    getSnapshot() {
        return this.data?.getSnapshot();
    }
    destroy() {
        this.data = undefined;
        this.initialised = false;
    }
    update!: (u: JSONAssetData) => void;
    updateMetadata!: (m: unknown) => void;
    setHooks(hooks: { update: (u: JSONAssetData) => void; updateMetadata: (m: unknown) => void; }) {
        this.update = hooks.update;
        this.updateMetadata = hooks.updateMetadata;
    }
}

export type { JSONAssetData };
export { JSONAsset, Controller };
