import React, { useEffect, useState, useRef } from 'react';

const target = "JS::BACKGROUND::http://localhost:8000/ProjectState";

function useMessageChannel(channel: string) {
  // const [data, setData] = useState<any>();
  // useEffect(() => {
  //   const cb = (source: string, content: any) => {
  //     ////console.log(content);
  //     if (content.channel !== channel) return;
  //     setData(content);
  //     // ////console.log('Received message from source:', source);
  //     // ////console.log('Message content:', content);
  //   };
  //   globalThis.messageService.subscribe(cb);


  //   // globalThis.sendMessage(target, {
  //   //   channel,
  //   //   request: "subscribe",
  //   // })
  //   return () => {
  //     globalThis.messageService.unsubscribe(cb);
  //   };
  // }, []);

  // return data;



}

function useChannel(channel: string, callback: Function) {
  const guard = useRef(false);
  useEffect(() => {
    if (guard.current) return;
    guard.current = true;
    globalThis.CK_ADAPTER.onChannel(channel, callback);
  }, []);
}

function messageChannel(channel: string, request: string, payload: any, subscriber_id: string) {
  // globalThis.sendMessage(target, {
  //   channel: channel,
  //   request: request,
  //   payload: payload,
  // })

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





export { useMessageChannel, messageChannel, useChannel };



