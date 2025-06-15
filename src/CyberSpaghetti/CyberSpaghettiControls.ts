type ControlsData = {
    // Composition
    canvasWidth: number; // [0, 3840]
    canvasHeight: number; // [0, 3840]
    centerX: number; // [0.0, 1.0]
    centerY: number; // [0.0, 1.0]
    innerRadius: number; // [0.0, 1.0]
    outerRadius: number; // [0.0, 1.0]
    startAngle: number; // [0, 360]
    endAngle: number; // [0, 360]
    // Motion
    rayLife: number; // [0, 300]
    numCycles: number; // [1, 10]
    // Rays - Global
    numRays: number; // [0, 500]
    rayColors: number[][]; // array of color values (hex strings)
    blendMode: 'normal' | 'additive';
    // Rays - Appearance
    thickness: number; // [0.0, 1.0]
    feather: number; // [0.0, 1.0]
    shape: 'constant' | 'tapered';
    // Rays - Distortion
    amplitude: number; // [0.0, 1.0]
    frequency: number; // [0.0, 1.0]
    pattern: 'zigzag' | 'sine' | 'jitter';
    perspectiveSkew: number; // [0, 1.0]
    includeFadeInOut: boolean;
    phaseRandomization: number;
    rayLength: number; // [0.0, 1.0]
    rayLengthRandomization: number; // [0.0, 1.0]    
    thicknessRandomization: number; // [0.0, 1.0]
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

    static defaultControls = {
        canvasWidth: 1920,
        canvasHeight: 1080,
        centerX: 0.5,
        centerY: 0.5,
        innerRadius: 0.2,
        outerRadius: 0.8,
        startAngle: 0,
        endAngle: 360,
        rayLife: 120,
        numCycles: 3,
        numRays: 100,
        rayColors: [[255,0,0]],
        blendMode: 'normal',
        thickness: 0.5,
        feather: 0.2,
        shape: 'constant',
        amplitude: 0.2,
        frequency: 0.5,
        pattern: 'sine',
        perspectiveSkew: 0.1,
        includeFadeInOut: true,
        phaseRandomization: 0.1,
        backgroundColor: [0, 0, 0],
        rayLength: 0.5,
        rayLengthRandomization: 0.1,
        thicknessRandomization: 0.1,
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
            if (update) this.update(update);
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
    update!: (u: ControlsData) => void;
    updateMetadata!: (m: unknown) => void;
    setHooks(hooks: { update: (u: ControlsData) => void; updateMetadata: (m: unknown) => void; }) {
        this.update = hooks.update;
        this.updateMetadata = hooks.updateMetadata;
    }
}

export type { ControlsData };
export { Controls, Controller };
