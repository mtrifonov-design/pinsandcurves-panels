import React, { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import SignalList from './SignalList';
import EditingArea from './EditingArea';
import P5JSCanvas from './P5JSCanvasDEPR/P5JSCanvas';
import CodeEditor from './Code Editor';
import CK_Test from './CK_Test';
import Copilot from './Copilot';
import AssetManager from './AssetManagerDEPR/index';
import HTMLPreview from './HTMLPreview'
import { StyleProvider } from '@mtrifonov-design/pinsandcurves-design';
import CyberSpaghetti from './CyberSpaghetti/CyberSpaghetti';
import CyberSpaghettiControlConsole from './CyberSpaghetti/ControlConsole';
const Default = () => <h1>Default Page</h1>;


function App(p: { renderedCallback: Function }) {

  useEffect(() => {
    const { renderedCallback } = p;
    if (renderedCallback) {
      renderedCallback();
    }
  }, []);

  return (
    <div>
      <StyleProvider>
        <Routes>
          <Route path="/cktest" element={<CK_Test />} />
          <Route path="/" element={<Default />} />
          <Route path="/signals" element={<SignalList />} />
          <Route path="/editing" element={<EditingArea />} />
          {/* <Route path="/p5" element={<P5JSCanvas />} /> */}
          <Route path="/code" element={<CodeEditor />} />
          <Route path="/copilot" element={<Copilot />} />
          {/* <Route path="/assets" element={<AssetManager />} /> */}
          <Route path="/htmlpreview" element={<HTMLPreview />} />
          <Route path="/cyberspaghetti" element={<CyberSpaghetti />} />
          <Route path="/cyberspaghetti-controlconsole" element={<CyberSpaghettiControlConsole />} />
        </Routes>
      </StyleProvider>
    </div>
  );
}

export default App;
