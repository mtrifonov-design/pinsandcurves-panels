import React, { createContext, useEffect } from "react";
import { CK_Workload_Class } from "./CK_Workload";
import { OnUnit, CK_Workload } from "./types";
const CK_Context = createContext<{
  FreeWorkload: () => CK_Workload,
  onUnit: (callback: OnUnit) => void,
} | null>(null);

function CK_Provider(p: { 
    renderedCallback: () => void,
    onUnit: (callback: OnUnit) => void,
    pushWorkload: (workload: any, metadata:any) => void,
    children: React.ReactNode
}) {

  useEffect(() => {
    const { renderedCallback } = p;
    if (renderedCallback) {
      renderedCallback();
    }
  }, []);

  const FreeWorkload = () => new CK_Workload_Class((w,m) => {
    p.pushWorkload(w,m);
  });

  return (
    <CK_Context.Provider value={{
        FreeWorkload,
        onUnit: p.onUnit,
    }}>
        {p.children}
    </ CK_Context.Provider>
  )
}

function useCK() : {
    FreeWorkload: () => CK_Workload,
    onUnit: (cb: OnUnit) => void,
} {
    const context = React.useContext(CK_Context);
    if (!context) {
        throw new Error("useCK must be used within a CK_Provider");
    }
    return context;
}

export { CK_Provider, useCK };