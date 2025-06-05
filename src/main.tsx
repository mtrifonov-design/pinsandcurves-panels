import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HashRouter } from 'react-router';
import CK_Adapter from './CK_Adapter/CK_Adapter.ts';
import { CK_Provider } from './CK_Adapter/CK_Provider.tsx';
import { CK_UnitProvider } from './CK_Adapter/CK_UnitProvider.tsx';

new CK_Adapter((cb : () => void, onUnit : unknown, pushWorkload:unknown) => {
      const root = document.getElementById('root');
      if (root) {
        createRoot(root).render(
          <StrictMode>
            <HashRouter>
              <CK_Provider
                renderedCallback={cb}
                onUnit={onUnit}
                pushWorkload={pushWorkload}
              >
                <CK_UnitProvider>
                  <App renderedCallback={cb} />
                </CK_UnitProvider>
              </CK_Provider>
            </HashRouter>
          </StrictMode>,
        )
      }
});

