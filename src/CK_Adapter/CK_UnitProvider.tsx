
import React, { useEffect } from 'react';
import { useCK } from './CK_Provider'
import { CK_Unit, CK_Workload } from './types';

type RegisterUnitProcessor = (selector: (u: CK_Unit) => boolean, reactor: (u: CK_Unit, workload:CK_Workload) => void) => () => void;

class UnitManager {
    constructor() {
        this.unitProcessors = [];
    }
    unitProcessors: Array<{ selector: (u: any) => boolean, reactor: (u: any) => void }>;
    registerUnitProcessor(selector: (u: any) => boolean, reactor: (u: any) => void): RegisterUnitProcessor {
        this.unitProcessors.push({ selector, reactor });
        return () => {
            this.unitProcessors = this.unitProcessors.filter(up => up.selector !== selector && up.reactor !== reactor);
        };
    }
    processUnit(unit: any, workload:any): void {
        //console.log("Processing unit:", unit, this.unitProcessors);
        for (let i = 0; i < this.unitProcessors.length; i++) {
            const { selector, reactor } = this.unitProcessors[i];
            if (selector(unit)) {
                reactor(unit, workload);
                return;
            }
        }
    }
}

const CK_UnitContext = React.createContext(null);
function CK_UnitProvider(props:any) {
    const { onUnit } = useCK();
    const unitManagerRef = React.useRef(new UnitManager());
    const unitManager = unitManagerRef.current;
    useEffect(() => {
        onUnit((unit,workload) => unitManager.processUnit(unit,workload));
    });
    return (
        <CK_UnitContext.Provider value={{
            registerUnitProcessor: unitManager.registerUnitProcessor.bind(unitManager),
        }}>
            {props.children}
        </CK_UnitContext.Provider>
    );

}

function useRegisterUnitProcessor(): RegisterUnitProcessor {
  const context = React.useContext(CK_UnitContext);
  if (!context) {
    throw new Error("useRegisterUnitProcessor must be used within a CK_UnitProvider");
  }
  const { registerUnitProcessor } = context;
  return registerUnitProcessor;
}

function useUnit(selector: (u: any) => boolean, reactor: (u: any, w:any) => void): void {
  const registerUnitProcessor = useRegisterUnitProcessor();
  useEffect(() => {
    const unsubscribe = registerUnitProcessor(selector,reactor);
    return () => {
      unsubscribe();
    };
  }, [selector, reactor, registerUnitProcessor]);
}

export { CK_UnitProvider, useUnit, useRegisterUnitProcessor };
export type { RegisterUnitProcessor };