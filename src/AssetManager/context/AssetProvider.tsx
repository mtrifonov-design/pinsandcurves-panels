import React, {
  createContext,
  useSyncExternalStore,
  useRef,
  PropsWithChildren,
} from "react";
import { SubscriptionManager } from "../SubscriptionManager";
import { useCK } from "../../CK_Adapter/CK_Provider";
import { useRegisterUnitProcessor, useUnit } from "../../CK_Adapter/CK_UnitProvider";
import { CK_Circuit } from "../../CK_Adapter/CK_Circuit";

interface AssetProviderContext {
  assets: Record<string, any>;
  submitAssetIdDiffs: (diffs: {
    in: string[];
    out: string[];
  }) => void;
}

export const AssetManagerContext = createContext<AssetProviderContext | null>(null);

export const AssetProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const registerUnitProcessor = useRegisterUnitProcessor();
  const { FreeWorkload } = useCK();
  const subscriptionManagerRef = useRef<SubscriptionManager>(new SubscriptionManager(FreeWorkload, registerUnitProcessor));
  const subscriptionManager = subscriptionManagerRef.current;
  const assets = useSyncExternalStore(
    subscriptionManager.subscribe.bind(subscriptionManager),
    subscriptionManager.getSnapshot.bind(subscriptionManager),
  )

  useUnit((unit) => {
    return "INIT" in unit.payload
  }, async (unit, workload) => {
    const vertexId = unit.payload.payload.vertexId;
    const c = new CK_Circuit(registerUnitProcessor, workload);
    await subscriptionManager.init(vertexId, c);
    console.log("init complete")
    c.complete();
  });

  useUnit((unit) => {
    return "TERMINATE" in unit.payload
  }, async (unit, workload) => {
    const blockerId = unit.payload.payload.blocker_id;
    const c = new CK_Circuit(registerUnitProcessor, workload);
    await subscriptionManager.terminate(blockerId, c);
    c.thread("default").blocker(blockerId, 2);
    c.complete();
  });


  return (
    <AssetManagerContext.Provider value={{
      assets,
      submitAssetIdDiffs: subscriptionManager.submitAssetIdDiffs.bind(subscriptionManager),
    }}>
      {children}
    </AssetManagerContext.Provider>
  );
};
