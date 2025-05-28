type CK_Instance = {
    instance_id: string,
    modality: string,
    resource_id: string,
}

type CK_Worker_Unit = {
    type: "worker",
    id: string,
    sender: CK_Instance,
    receiver: CK_Instance,
    payload: unknown,
}

type CK_Blocker_Unit = {
    type: "blocker",
    id: string,
    blocker_id: string,
    blocker_count: number,
}

type CK_Terminate_Unit = {
    type: "terminate",
    id: string,
    instance: CK_Instance,
}

type CK_Unit = CK_Worker_Unit | CK_Blocker_Unit | CK_Terminate_Unit;


interface CK_Workload {
    thread(tId: string) : CK_Thread;
    dispatch() : void;
    setMetadata(key: string, value: unknown) : void;
}

interface CK_Thread {
    worker(receiver: CK_Instance, payload: unknown) : void;
    blocker(blocker_id: string, blocker_count: number) : void;
    terminate(instance: CK_Instance) : void;
}

type OnUnit = (unit: CK_Worker_Unit, newWorkload: CK_Workload) => void;

export type { OnUnit, CK_Workload, CK_Thread, CK_Unit, CK_Worker_Unit, CK_Blocker_Unit, CK_Terminate_Unit, CK_Instance };