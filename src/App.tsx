import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { StyleProvider } from '@mtrifonov-design/pinsandcurves-design';
import CyberSpaghetti from './Tools/CyberSpaghetti/CyberSpaghetti';
import CyberSpaghettiControlConsole from './Tools/CyberSpaghetti/ControlConsole';
import LiquidLissajous from './Tools/LiquidLissajous/LiquidLissajous';
import LiquidLissajousControlConsole from './Tools/LiquidLissajous/ControlConsole';

import NeonShower from './Tools/NeonShower';
import Viewer from './Tools/Viewer';

import Timeline from './Tools/Timeline'

import AssetTestPanel from './AssetManager/testPanel/AssetTestPanel';
import StarShapedDomainTool from './Tools/StarShapedDomainTool/StarShapedDomainTool';
import StarShapedDomainControlConsole from './Tools/StarShapedDomainTool/ControlConsole';
import '@mtrifonov-design/pinsandcurves-design/dist/PinsAndCurvesStylesheet.css';

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
          <Route path="/viewer" element={<Viewer />} />
          <Route path="/neonshower" element={<NeonShower />} />
          <Route path="/cyberspaghetti" element={<CyberSpaghetti />} />
          <Route path="/cyberspaghetti-controlconsole" element={<CyberSpaghettiControlConsole />} />
          <Route path="/liquidlissajous" element={<LiquidLissajous />} />
          <Route path="/liquidlissajous-controlconsole" element={<LiquidLissajousControlConsole />} />
          <Route path="/echoknight" element={<StarShapedDomainTool />} />
          <Route path="/echoknight-controlconsole" element={<StarShapedDomainControlConsole />} />
          <Route path="/timeline" element={<Timeline />} />
        </Routes>
      </StyleProvider>
    </div>
  );
}

export default App;
