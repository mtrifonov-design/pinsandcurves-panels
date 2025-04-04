import React, { useEffect, useState } from 'react';

const target = "JS::BACKGROUND::http://localhost:8000/ProjectState/index.js";

function useMessageChannel(channel:string) {
    const [data, setData] = useState<any>();
    useEffect(() => {
      const cb = (source: string, content: any) => {
        //console.log(content);
        if (content.channel !== channel) return;
        setData(content);
        // //console.log('Received message from source:', source);
        // //console.log('Message content:', content);
      };
      globalThis.messageService.subscribe(cb);
  
  
      // globalThis.sendMessage(target, {
      //   channel,
      //   request: "subscribe",
      // })
      return () => {
        globalThis.messageService.unsubscribe(cb);
      };
    }, []);
  
    return data;
  }


  function messageChannel(channel: string, request: string, payload: any) {
    globalThis.sendMessage(target, {
      channel: channel,
      request: request,
      payload: payload,
    })
  }





  export { useMessageChannel, messageChannel };



