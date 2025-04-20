import React, { useEffect, useState, useRef } from 'react';

const target = "JS::BACKGROUND::http://localhost:8000/ProjectState";

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

function useUnit(callback: Function) {
  const guard = useRef(false);
  useEffect(() => {
    if (guard.current) return;
    guard.current = true;
    globalThis.CK_ADAPTER.onUnit(callback);
  }, []);
}

function messageChannel(channel: string, request: string, payload: any, subscriber_id: string) {
  globalThis.CK_ADAPTER.pushWorkload({
    default: [
      {
        type: "worker",
        receiver: {
          instance_id: "BACKGROUND",
          modality: "wasmjs",
          resource_id: "http://localhost:8000/ProjectState",
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



