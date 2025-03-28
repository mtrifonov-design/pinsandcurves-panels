import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router';

let PW = '';
window.addEventListener('message', (event) => {
  const m = JSON.parse(event.data);
  if (m.type === "mog-message") {
    const content = m.content;
    if (content.MOG_INSTALL) {
      PW = content.pw;
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </StrictMode>,
      )
    } else {
      const e = new CustomEvent('mog-message', {
        detail: content,
      });
      window.dispatchEvent(e);
    }
  }
});

globalThis.sendMessage = (target: string, message: string) => {
  const packaged = {
    pw: PW,
    target: target,
    content: message,
  }
  window.parent.postMessage(JSON.stringify({
    type: "mog-message",
    content: packaged,
  }), "*");
}

class MessageService {
  subscribers: ((message: any) => void)[] = [];
  subscribe(callback: (message: any) => void) {
    this.subscribers.push(callback);
  }
  unsubscribe(callback: (source: string, content: any) => void) {
    this.subscribers = this.subscribers.filter((cb) => cb !== callback);
  }

  constructor() {
    window.addEventListener('mog-message', (event) => {
      const message = event.detail;
      this.subscribers.forEach((callback) => {
        const { source, content } = message;
        callback(source, content);
      });
    });
  }
}

globalThis.messageService = new MessageService();
