import React, {
    createContext,
    useLayoutEffect,
    useContext,
    useRef,
    PropsWithChildren,
    useState,
  } from "react";
  import { SubscriptionManager } from "../subscriptions/SubscriptionManager";
  import { useUnit } from "../../hooks";
  
  /* ——————————————————————————————————————————————————————— */
  /* Registry: keeps track of *all* managers created by hooks */
  /* ——————————————————————————————————————————————————————— */
  
  interface Registry {
    /** true once we forwarded the very first INIT */
    initialized: boolean;
    /** add / remove a manager instance */
    register: (m: SubscriptionManager) => void;
    unregister: (m: SubscriptionManager) => void;
  }
  
  export const AssetManagerContext = createContext<Registry | null>(null);
  const INITContext = createContext<any>(null);
  
  export const AssetProvider: React.FC<PropsWithChildren<{}>> = ({
    children,
  }) => {
    /* one Set for all managers ever mounted */
    const managersRef = useRef<Set<SubscriptionManager>>(new Set());
    const [initState,setInitState] = useState<any>(null);
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
  
    /* blocker bookkeeping for TERMINATE */
    const blockerIdRef = useRef<string | null>(null);
  
    /* forward every CK event to *all* registered managers */
    useUnit(unit => {
        ////console.log("unit", unit);
      const { sender, payload } = unit;
      const { INIT, TERMINATE, blocker_id, payload: p } = payload;
  
      if (INIT && !registryRef.current.initialized) {
        registryRef.current.initialized = true;
        managersRef.current.forEach(m => m.handleInit());
        setInitState(p);
        return;
      }
  
      if (TERMINATE) {
        blockerIdRef.current = blocker_id;
        /* wait for every manager to finish its own unsubscribe saga */
        Promise.all(
          Array.from(managersRef.current).map(m => m.handleTerminate())
        ).then(() => {
          CK_ADAPTER.pushWorkload({
            default: [
              {
                type: "blocker",
                blocker_id: blockerIdRef.current,
                id: crypto.randomUUID(),
                blocker_count: 2,
              },
            ],
          });
        });
        return;
      }
  
      /* regular payload: broadcast to every manager */
      managersRef.current.forEach(m => m.handleEvent(sender, payload));
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
  