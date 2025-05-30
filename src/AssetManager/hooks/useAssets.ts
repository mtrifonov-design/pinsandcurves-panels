import {
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useSyncExternalStore,
  } from "react";
  import { AssetManagerContext } from "../context/AssetProvider";
  import { SubscriptionManager } from "../subscriptions/SubscriptionManager";
import { useCK } from "../../CK_Adapter/CK_Provider";
  
  /** Hook signature stays the same, you pass any number of desired assets */
  export function useAssets(
    desired: { assetId: string; assetController: unknown }[]
  ) {
    const registry = useContext(AssetManagerContext);
    if (!registry)
      throw new Error("useAssets must be used inside an <AssetProvider>.");

    const { FreeWorkload} = useCK();
  
    /* each hook call owns ONE manager instance */
    const managerRef = useRef<SubscriptionManager>();
    //console.log("useAssets", registry)
    if (!managerRef.current) managerRef.current = new SubscriptionManager({FreeWorkload,vertexId: registry ? registry.vertexId : undefined});
  
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
  