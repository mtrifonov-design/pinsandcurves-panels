import React, { useState, useCallback } from 'react';
import AssetManager from './AssetManager'
import { useUnit } from '../hooks';
import CONFIG from '../Config';

function AssetManagerWrapper() {

  const [ready, setReady ] = useState(false);
  const [assets, setAssets] = useState([]);

  useUnit((unit) => {
    const { payload } = unit;
    const { INIT, request, payload: data } = payload;
    if (INIT) {
      globalThis.CK_ADAPTER.pushWorkload({
        asset: [
          {
            type: "worker",
            receiver: {
              instance_id: "ASSET_SERVER",
              modality: "wasmjs",
              resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServer`,
            },
            payload: {
              request: "subscribe",
              payload: undefined,
            },
          }
        ]
      })
    }

    if (request === "subscribeConfirmation") {
      setReady(true);
      setAssets(data);
      return;
    }

    if (request === "assetEvent") {
      const newAssets = data.filter(asset => {
        return !assets.some(existingAsset => existingAsset.asset_id === asset.asset_id);
      });
      setAssets(prev => [...prev, ...newAssets]);
      return;
    }
  })

  return <AssetManager
          ready={ready}
          onAssetUpload={(asset) => {
            globalThis.CK_ADAPTER.pushWorkload({
              asset: [
                {
                  type: "worker",
                  receiver: {
                    instance_id: "ASSET_SERVER",
                    modality: "wasmjs",
                    resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServer`,
                  },
                  payload: {
                    request: "pushAssets",
                    payload: [asset],
                  },
                }
              ]
            })
          }}
          assets={assets}
          setAssets={setAssets}
 />

}

export default AssetManagerWrapper;