import { LISSAJOUS_CURVES, LissajousParams } from "./core/lissajousCurves";

type ControlsData = {
    particleCount: number;
    mixingIntensity: number;
    particleColors: [number, number, number][];
    backgroundColor: [number, number, number];
    loopLifecycle: number,
    showLissajousFigure: boolean;
    ratioA: number;
    ratioB: number;
    offset: number;
    width: number;
    height: number;
    figureScaleX: number;
    figureScaleY: number;
    noiseIntensity: number;
    noiseEnabled: boolean;
    noiseScale: number;
    noiseSpeed: number;
    fluidWarpEnabled: boolean;
    fluidWarpIntensity: number;
    fluidWarpScale: number;
    fluidWarpSpeed: number;
    lissajousParams: LissajousParams;
    animationSpeed: number;
    rotateVertical: number;
    rotateHorizontal: number;
}

class Controls {
    data: ControlsData;
    constructor(data : ControlsData) {
        this.data = data;
    }

    setData(data : ControlsData) {
        this.data = data;
        //this.#notifyInternalSubscribers();
        this.#notifyExternalSubscribers();
    }

    externalState: string = crypto.randomUUID();
    receiveExternalUpdate(update : ControlsData) {
        this.data = update
        this.externalState = crypto.randomUUID();
        this.#notifyExternalStateSubscribers();
        this.#notifyInternalSubscribers();
    }

    #externalStateSubscribers = [];
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

    #internalSubscribers = [];
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
        particleCount: 10,
        particleColors: [
            [255, 0, 0],
            [0,255, 0],
            [0, 0, 255],
        ],
        backgroundColor: [0, 0, 0],
        loopLifecycle: 300,
        mixingIntensity: 0.3,
        showLissajousFigure: false,
        ratioA: 1,
        ratioB: 2,
        offset: Math.PI / 2,
        width: 1920,
        height: 1080,
        figureScaleX: 0.2,
        figureScaleY: 0.3,
        noiseEnabled: true,
        noiseScale: 0.1,
        noiseIntensity: 0.1,
        noiseSpeed: 0.1,
        fluidWarpEnabled: true,
        fluidWarpIntensity: 0.1,
        fluidWarpScale: 0.1,
        fluidWarpSpeed: 0.1,
        lissajousParams: LISSAJOUS_CURVES[0],
        animationSpeed: 0.2,
        rotateVertical: 0,
        rotateHorizontal: 0,
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
    setHooks(hooks) {
        this.update = hooks.update;
        this.updateMetadata = hooks.updateMetadata;
    }
}

export type { ControlsData };
export { Controls, Controller };
