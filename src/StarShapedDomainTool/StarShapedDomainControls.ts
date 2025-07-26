import { LISSAJOUS_CURVES, LissajousParams } from "./core/lissajousCurves";

type ControlsData = {

    width: number;
    height: number;
    
    colorStops: {
        r: number;
        g: number;
        b: number;
        pc: number;
    }[];

    canvasPoint: [number, number];
    canvasScale: number;
    shapeScale: number;

    shapePoint: [number, number];

    perspectiveFactor: number;

    noiseDegenerationEnabled: boolean;
    noiseDegenerationAmplitude: number;
    noiseDegenerationFrequency: number;

    speed: number;
    exportDuration: number;
    exportPerfectLoop: boolean;

    shapeImageAssetId: string;

    showShapeInspector: boolean;
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
        width: 800,
        height: 600,
        colorStops: [
            { r: 0, g: 0, b: 0, pc: 0 },
            { r: 1, g: 0, b: 0, pc: 0.2 },
            { r: 0, g: 1, b: 0, pc: 0.5 },
            { r: 0, g: 0, b: 1, pc: 0.8 },
        ],
        canvasPoint: [0, 0],
        canvasScale: 1,
        shapeScale: 1,
        shapePoint: [0, 0],
        perspectiveFactor: 1,
        noiseDegenerationEnabled: false,
        noiseDegenerationAmplitude: 0.5,
        noiseDegenerationFrequency: 1.0,
        speed: 1.0,
        exportDuration: 10,
        exportPerfectLoop: true,
        shapeImageAssetId: '',
        showShapeInspector: false,
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
