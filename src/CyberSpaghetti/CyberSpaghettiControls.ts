
type ControlsData = {
    centerX: number;
    centerY: number;
    backgroundColor: [number, number, number];
    maxRays: number;
    rayColors: [number, number, number][];
    averageThickness: number;
    thicknessVariance: number;
    lifespan: number;
    waveAmplitude: number;
    waveFrequency: number;
}

class Controls {
    data: ControlsData;
    constructor(data : ControlsData) {
        this.data = data;
    }

    setData(data : ControlsData) {
        this.data = data;
        this.#notifyInternalSubscribers();
        this.#notifyExternalSubscribers();
    }

    receiveExternalUpdate(update : ControlsData) {
        this.data = update
        this.#notifyInternalSubscribers();
    }

    #internalSubscribers = [];
    subscribeInternal(cb: () => void) {
        this.#internalSubscribers.push(cb);
        return () => {
            this.#internalSubscribers = this.#internalSubscribers.filter((c) => c !== cb);
        }
    }
    #notifyInternalSubscribers() {
        this.#internalSubscribers.forEach((cb) => cb());
    }

    #externalSubscribers = [];
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

    static defaultControls = {
        centerX: 1920 /( 2),
        centerY: 1080 /( 2),
        backgroundColor: [0, 0, 0],
        maxRays: 500,
        rayColors: [[255, 255, 255]],
        averageThickness: 2,
        thicknessVariance: 1,
        lifespan: 60,
        waveAmplitude: 0,
        waveFrequency: 0
    }
}

export default class Controller {
    initialised = false
    data?: Controls;
    constructor() {}
    load(data: ControlsData) {
        this.data = new Controls(data);
        this.data.subscribeExternal(() => {
            const update = this.data?.getSnapshot();
            this.update(update);
        })
        this.initialised = true;
    }
    receiveUpdate(update: ControlsData) {
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
    update: (u: any) => void;
    updateMetadata: (m: any) => void;
    create: (c: any) => void;
    delete: (d: any) => void;
    subscribe: (s: any) => void;
    unsubscribe: (u: any) => void;
    setHooks(hooks) {
        this.update = hooks.update;
        this.create = hooks.create;
        this.delete = hooks.delete;
        this.subscribe = hooks.subscribe;
        this.unsubscribe = hooks.unsubscribe;
        this.updateMetadata = hooks.updateMetadata;
    }
}

export type { ControlsData };
export { Controls, Controller };
