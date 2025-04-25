import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, HashRouter } from 'react-router';
import CK_Adapter from './CK_Adapter.ts';

new CK_Adapter((cb : Function) => {
      const root = document.getElementById('root');
      if (root) {
        createRoot(root).render(
          <StrictMode>
            <HashRouter>
              <App renderedCallback={cb} />
            </HashRouter>
          </StrictMode>,
        )
      }
});

