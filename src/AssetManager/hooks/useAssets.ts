import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { AssetManagerContext } from "../context/AssetProvider";
import { Asset, SubscriptionManager } from "../SubscriptionManager";
import { useCK } from "../../CK_Adapter/CK_Provider";

/** Hook signature stays the same, you pass any number of desired assets */
export function useAssets(
  assetList: { assetId: string; assetController: unknown }[]
) {
  const { assets, submitAssetIdDiffs } = useContext(AssetManagerContext);

  const lastAssetListRef = useRef<{ assetId: string; assetController: unknown }[]>(
    []
  );
  useEffect(() => {

    const lastAssetList = lastAssetListRef.current;
    if (lastAssetList.length === assetList.length &&
      lastAssetList.every((item, index) => item.assetId === assetList[index].assetId)) {
      return; // No changes in the asset list
    }
    const outList = lastAssetListRef.current;
    const inList = assetList;
    submitAssetIdDiffs({ in: inList, out: outList });
    lastAssetListRef.current = assetList;
  }, [assetList, submitAssetIdDiffs, lastAssetListRef]);

  const finalAssets = {}
  let initialized = true;
  for (let i = 0; i < assetList.length; i++) {
    const { assetId } = assetList[i];
    const asset = assets[assetId]
    if (asset && asset.initialized) {
      finalAssets[assetId] = asset.controller;
    } else {
      initialized = false;
    }
  }

  return {
    initialized: initialized,
    assets: finalAssets,
  };
}
