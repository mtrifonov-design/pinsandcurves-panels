import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router';
import CK_Adapter from './CK_Adapter.ts';


new CK_Adapter((cb : Function) => {
      const root = document.getElementById('root');
      if (root) {
        createRoot(root).render(
          <StrictMode>
            <BrowserRouter>
              <App renderedCallback={cb} />
            </BrowserRouter>
          </StrictMode>,
        )
      }
});



// let PASSWORD;
// window.addEventListener('message', (event) => {
//   const m = event.data;
//   if (
//     m &&
//     m.type &&
//     m.type === "ck-message"
//   ) {
//     const payload = m.payload;
//     const { CK_INSTALL } = payload;
//     if (CK_INSTALL) {
//       const { pw, instanceId } = payload;
//       PASSWORD = pw;
//       globalThis.INSTANCE_ID = instanceId;
//       const root = document.getElementById('root');
//       if (root) {
//         createRoot(root).render(
//           <StrictMode>
//             <BrowserRouter>
//               <App />
//             </BrowserRouter>
//           </StrictMode>,
//         )
//       }
//       window.parent.postMessage(m, "*");
//     }
//   }
// })

// class ComputeService {
//   compute(unit) {
//     // Implement your compute logic here
//     return this.callback(unit);
//   }

//   callback: Function | null = null;
//   onUnit(callback) {
//     this.callback = callback;
//   }

//   pushWorkload(workload) {
//     window.parent.postMessage({
//       type: "ck-message",
//       payload: {
//         PUSH_WORKLOAD: true,
//         pw: PASSWORD,
//         workload,
//       },
//     }, "*");
//   }
// }

// const computeService = new ComputeService();
// globalThis.computeService = computeService;

// window.addEventListener('message', (event) => {
//   const m = event.data;
  
//   if (
//     m &&
//     m.type &&
//     m.type === "ck-message"
//   ) {
//     const payload = m.payload;
//     const { CK_COMPUTE } = payload;
//     if (CK_COMPUTE) {
//       const { unit } = payload;
//       const result = computeService.compute(unit);
//       //console.log(result);
//       window.parent.postMessage({
//         type: "ck-message",
//         payload: {
//           CK_COMPUTE: true,
//           pw: PASSWORD,
//           response: result,
//         },
//       }, "*");
//     }
//   }
// })




// let PW = '';
// window.addEventListener('message', (event) => {
//   const m = JSON.parse(event.data);
//   if (m.type === "mog-message") {
//     const content = m.content;
//     if (content.MOG_INSTALL) {
//       PW = content.pw;
//       createRoot(document.getElementById('root')!).render(
//         <StrictMode>
//           <BrowserRouter>
//             <App />
//           </BrowserRouter>
//         </StrictMode>,
//       )
//     } else {
//       const e = new CustomEvent('mog-message', {
//         detail: content,
//       });
//       window.dispatchEvent(e);
//     }
//   }
// });

// globalThis.sendMessage = (target: string, message: string) => {
//   const packaged = {
//     pw: PW,
//     target: target,
//     content: message,
//   }
//   window.parent.postMessage(JSON.stringify({
//     type: "mog-message",
//     content: packaged,
//   }), "*");
// }

// class MessageService {
//   subscribers: ((message: any) => void)[] = [];
//   subscribe(callback: (message: any) => void) {
//     this.subscribers.push(callback);
//   }
//   unsubscribe(callback: (source: string, content: any) => void) {
//     this.subscribers = this.subscribers.filter((cb) => cb !== callback);
//   }

//   constructor() {
//     window.addEventListener('mog-message', (event) => {
//       const message = event.detail;
//       this.subscribers.forEach((callback) => {
//         const { source, content } = message;
//         callback(source, content);
//       });
//     });
//   }
// }

// globalThis.messageService = new MessageService();
