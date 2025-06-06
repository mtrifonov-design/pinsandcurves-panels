import { CK_Instance, CK_Unit, CK_Workload } from "./types";
import type { RegisterUnitProcessor } from "./CK_UnitProvider";

class CK_Circuit {
    workload: CK_Workload;
    registerUnitProcessor: RegisterUnitProcessor;
    constructor(registerUnitProcessor: RegisterUnitProcessor, w: CK_Workload) {
        this.registerUnitProcessor = registerUnitProcessor;
        this.workload = w;
    }

    registeredRoutes: Record<string, () => void> = {};
    registerRoute(route: string, instance: CK_Instance, callback: (u: CK_Unit) => void) {
        if (!(route in this.registeredRoutes)) {
            const responseRoute = `${route}_response`;
            this.registeredRoutes[route] = this.registerUnitProcessor(
                (unit) => unit.type === "worker" 
                && unit.sender.instance_id === instance.instance_id
                && unit.sender.resource_id === instance.resource_id
                && unit.sender.modality === instance.modality
                && responseRoute in unit.payload,
                (unit, workload) => {
                    this.workload = workload;
                    callback(unit.payload[responseRoute]);
                    this.registeredRoutes[route]();
                    delete this.registeredRoutes[route];
                }
            );
        }
    }

    complete() {
        for (const route in this.registeredRoutes) {
            this.registeredRoutes[route]();
        }
        this.registeredRoutes = {};
        this.workload.dispatch();
    }

    instance(instance : CK_Instance) {
        return new CK_Circuit_Instance(instance, this);
    }

    thread(threadId: string) {
        return this.workload.thread(threadId);
    }
}

class CK_Circuit_Instance {
    instance: CK_Instance;
    circuit: CK_Circuit;
    constructor(instance: CK_Instance, circuit: CK_Circuit) {
        this.instance = instance;
        this.circuit = circuit;
    }

    async call(route: string, payload: unknown) {
        this.circuit.workload.thread("default").worker(this.instance, {
            [route]: payload,
        });
        this.circuit.workload.dispatch();
        return await new Promise<unknown>((resolve, reject) => {
            this.circuit.registerRoute(route, this.instance, payload => {
                resolve(payload);
            });
        });
    }
}

export { CK_Circuit };