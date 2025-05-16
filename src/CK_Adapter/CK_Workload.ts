
import type { CK_Workload, CK_Thread, CK_Unit, 
    CK_Worker_Unit, CK_Instance, CK_Terminate_Unit,
    CK_Blocker_Unit
} from "./types";

class CK_Workload_Class implements CK_Workload {

    private onDispatch: (w: unknown) => void;
    constructor(onDispatch: (w: unknown) => void) {
        this.onDispatch = onDispatch;
    }

    private threads: { [key: string]: CK_Unit[] } = {};
    thread(tId: string): CK_Thread {
        if (!this.threads[tId]) {
            this.threads[tId] = [];
        }
        return new CK_Thread_Class(tId, this.threads);   
    }

    expired= false;
    dispatch() {
        if (this.expired) {
            throw new Error("Workload expired");
        }

        this.expired = true;
        this.onDispatch(this.threads);
    }

}

class CK_Thread_Class implements CK_Thread {
    private threadId: string;
    private threads: { [key: string]: CK_Unit[] };
    constructor(threadId: string, threads: { [key: string]: CK_Unit[] }) {
        this.threadId = threadId;
        this.threads = threads;
    }

    worker(receiver: CK_Instance, payload: unknown): void {
        const unit: CK_Worker_Unit = {
            type: "worker",
            id: crypto.randomUUID(),
            receiver,
            payload,
        };
        this.threads[this.threadId].push(unit);
    }

    blocker(blocker_id: string, blocker_count: number): void {
        const unit: CK_Blocker_Unit = {
            type: "blocker",
            id: crypto.randomUUID(),
            blocker_id,
            blocker_count,
        };
        this.threads[this.threadId].push(unit);
    }
    terminate(instance: CK_Instance): void {
        const unit: CK_Terminate_Unit = {
            type: "terminate",
            id: crypto.randomUUID(),
            instance,
        };
        this.threads[this.threadId].push(unit);
    }
}

export { CK_Workload_Class };