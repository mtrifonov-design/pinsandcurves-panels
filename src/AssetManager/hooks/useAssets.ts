import {
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useSyncExternalStore,
  } from "react";
  import { AssetManagerContext } from "../context/AssetProvider";
  import { SubscriptionManager } from "../subscriptions/SubscriptionManager";
  
  /** Hook signature stays the same, you pass any number of desired assets */
  export function useAssets(
    desired: { assetId: string; assetController: unknown }[]
  ) {
    const registry = useContext(AssetManagerContext);
    if (!registry)
      throw new Error("useAssets must be used inside an <AssetProvider>.");
  
    /* each hook call owns ONE manager instance */
    const managerRef = useRef<SubscriptionManager>();
    if (!managerRef.current) managerRef.current = new SubscriptionManager();
  
    /* register / unregister exactly once */
    useEffect(() => {
      registry.register(managerRef.current!);
      return () => registry.unregister(managerRef.current!);
    }, [registry]);
  
    /* push desired list every render */
    useLayoutEffect(() => {
      managerRef.current!.setDesired(desired);
    }, [desired] );
  
    /* React 18 external‑store glue */
    const ext = useSyncExternalStore(
      managerRef.current!.subscribe,
      managerRef.current!.getSnapshot
    );
    return managerRef.current!.getAssetPresentation();

  }
  