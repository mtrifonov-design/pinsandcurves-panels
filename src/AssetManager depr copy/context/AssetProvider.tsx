import React, {
  createContext,
  useLayoutEffect,
  useContext,
  useRef,
  PropsWithChildren,
  useState,
} from "react";
import { SubscriptionManager } from "../subscriptions/SubscriptionManager";
//import { useUnit } from "../../hooks";
import { useCK } from "../../CK_Adapter/CK_Provider";
import { useUnit } from "../../CK_Adapter/CK_UnitProvider";

/* ——————————————————————————————————————————————————————— */
/* Registry: keeps track of *all* managers created by hooks */
/* ——————————————————————————————————————————————————————— */

interface Registry {
  /** true once we forwarded the very first INIT */
  initialized: boolean;
  /** add / remove a manager instance */
  register: (m: SubscriptionManager) => void;
  unregister: (m: SubscriptionManager) => void;
  vertexId?: string;
}

export const AssetManagerContext = createContext<Registry | null>(null);
const INITContext = createContext<any>(null);


// class UnitCallbackManger {
//   callbacks: Map<string, (payload: any, workload: any) => void> = new Map();
//   registerCallback(
//     callbackId: string,
//     callback: (payload: any, workload: any) => void,
//   ) {
//     this.callbacks.set(callbackId, callback);
//   }
//   unregisterCallback(callbackId: string) {
//     this.callbacks.delete(callbackId);
//   }
// }

// const UnitCallbackContext = React.createContext<UnitCallbackManger | null>(null);

export const AssetProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  /* one Set for all managers ever mounted */
  const managersRef = useRef<Set<SubscriptionManager>>(new Set());
  const [initState, setInitState] = useState<any>(null);
  /* the object we expose through context (stable ref) */
  const registryRef = useRef<Registry>({
    initialized: false,
    register: m => {
      managersRef.current.add(m);
      /* if INIT already happened, bring the newcomer up to speed */
      if (registryRef.current.initialized) m.handleInit();
    },
    unregister: m => {
      managersRef.current.delete(m);
    },
  });
  const { FreeWorkload } = useCK();


  /* blocker bookkeeping for TERMINATE */
  const blockerIdRef = useRef<string | null>(null);

  const currentWorkloadRef = useRef(null);

  /* forward every CK event to *all* registered managers */
  useUnit((unit) => {
    return "TERMINATE" in unit.payload
    || "INIT" in unit.payload
    || "receiveUpdate" in unit.payload
    || "subscriptionConfirmation" in unit.payload
    || "unsubscribeConfirmation" in unit.payload
    || "getAssetResponse" in unit.payload
    || "deleteNotification" in unit.payload
    || "receiveMetadataUpdate" in unit.payload;
  },(unit, workload) => {
    currentWorkloadRef.current = workload;
    const { sender, payload } = unit;
    const { INIT, TERMINATE, blocker_id, payload: p, } = payload;


    if (INIT && !registryRef.current.initialized) {
      registryRef.current.initialized = true;
      registryRef.current.vertexId = p.vertexId;
      //console.log("INIT", p);
      managersRef.current.forEach(m => m.handleInit(p.vertexId));
      //console.log(managersRef.current);
      setInitState(p);
      workload.dispatch();
      return;
    }

    if (TERMINATE) {
      blockerIdRef.current = blocker_id;
      /* wait for every manager to finish its own unsubscribe saga */
      const managers = Array.from(managersRef.current);
      const releaseManagers = [...managers];
      if (managers.length === 0) {
        workload.thread("default").blocker(blockerIdRef.current as string, 2);
        workload.dispatch();
        return;
      }
      managers.map(m => m.handleTerminate((self: any) => {
        const idx = releaseManagers.indexOf(self);
        if (idx !== -1) releaseManagers.splice(idx, 1);
        if (releaseManagers.length === 0) {
          const workload = currentWorkloadRef.current;
          workload.thread("default").blocker(blockerIdRef.current as string, 2);
          workload.dispatch();
        }
      }, workload));
      //console.log(workload)
      workload.dispatch();
      return;
    }


    /* regular payload: broadcast to every manager */
    managersRef.current.forEach(m => m.handleEvent(sender, payload, workload));
    workload.dispatch();
  });

  return (
      <AssetManagerContext.Provider value={registryRef.current}>
        <INITContext.Provider value={initState}>
          {children}
        </INITContext.Provider>
      </AssetManagerContext.Provider>
  );
};



export function useInit() {
  const init = useContext(INITContext);
  return init;
}
