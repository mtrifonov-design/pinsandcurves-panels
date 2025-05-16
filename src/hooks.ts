import React, { useEffect, useState, useRef } from 'react';
import CONFIG from './Config';
import { useCK } from './CK_Adapter/CK_Provider';
import { OnUnit } from './CK_Adapter/types';

function useMessageChannel(channel: string) {
}

function useChannel(channel: string, callback: Function) {
  const guard = useRef(false);
  useEffect(() => {
    if (guard.current) return;
    guard.current = true;
    globalThis.CK_ADAPTER.onChannel(channel, callback);
  }, []);
}

function useUnit(callback: OnUnit) {
  const { onUnit, FreeWorkload} = useCK();
  useEffect(() => {
    onUnit(callback);
  });
}

function messageChannel(channel: string, request: string, payload: any, subscriber_id: string) {
  globalThis.CK_ADAPTER.pushWorkload({
    default: [
      {
        type: "worker",
        receiver: {
          instance_id: "BACKGROUND",
          modality: "wasmjs",
          resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}ProjectState`,
        },
        payload: {
          channel,
          request,
          payload,
          subscriber_id,

        },
      },
    ]
  });
}





export { useMessageChannel, messageChannel, useChannel, useUnit };



