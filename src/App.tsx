import React, { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import SignalList from './SignalList';
import EditingArea from './EditingArea';
import P5JSCanvas from './P5JSCanvasDEPR/P5JSCanvas';
import CodeEditor from './Code Editor';
import CK_Test from './CK_Test';
import Copilot from './DEPR/Copilot';
import AssetManager from './AssetManagerDEPR/index';
import HTMLPreview from './HTMLPreview'
import { StyleProvider } from '@mtrifonov-design/pinsandcurves-design';
import CyberSpaghetti from './CyberSpaghetti/CyberSpaghetti';
import CyberSpaghettiControlConsole from './CyberSpaghetti/ControlConsole';
import LiquidLissajous from './LiquidLissajous/LiquidLissajous';
import LiquidLissajousControlConsole from './LiquidLissajous/ControlConsole';
import AssetTestPanel from './AssetManager/testPanel/AssetTestPanel';
import StarShapedDomainTool from './StarShapedDomainTool/StarShapedDomainTool';
import StarShapedDomainControlConsole from './StarShapedDomainTool/ControlConsole';

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
          <Route path="/" element={<Default />} />
          <Route path="/asset-test-panel" element={<AssetTestPanel />} />
          <Route path="/signals" element={<SignalList />} />
          <Route path="/editing" element={<EditingArea />} />
          {/* <Route path="/p5" element={<P5JSCanvas />} /> */}
          <Route path="/code" element={<CodeEditor />} />
          {/* <Route path="/copilot" element={<Copilot />} /> */}
          {/* <Route path="/assets" element={<AssetManager />} /> */}
          {/* <Route path="/htmlpreview" element={<HTMLPreview />} /> */}
          <Route path="/cyberspaghetti" element={<CyberSpaghetti />} />
          <Route path="/cyberspaghetti-controlconsole" element={<CyberSpaghettiControlConsole />} />
          <Route path="/liquidlissajous" element={<LiquidLissajous />} />
          <Route path="/liquidlissajous-controlconsole" element={<LiquidLissajousControlConsole />} />
          <Route path="/starshapeddomainwipe" element={<StarShapedDomainTool />} />
          <Route path="/starshapeddomainwipe-controlconsole" element={<StarShapedDomainControlConsole />} />
        
        </Routes>
      </StyleProvider>
    </div>
  );
}

export default App;
