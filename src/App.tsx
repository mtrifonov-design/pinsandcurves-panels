import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import SignalList from './SignalList';
import EditingArea from './EditingArea';
import P5JSCanvas from './P5JSCanvas';
import CodeEditor from './CodeEditor';
import CK_Test from './CK_Test';
import Copilot from './Copilot';
import AssetManager from './AssetManager/index';
const Default = () => <h1>Default Page</h1>;


function App() {

  return (
    <div>
      <Routes>
        <Route path="/cktest" element={<CK_Test />} />
        <Route path="/" element={<Default />} />
        <Route path="/signals" element={<SignalList />} />
        <Route path="/editing" element={<EditingArea />} />
        <Route path="/p5" element={<P5JSCanvas />} />
        <Route path="/code" element={<CodeEditor />} />
        <Route path="/copilot" element={<Copilot />} />
        <Route path="/assets" element={<AssetManager />} />
      </Routes>
    </div>
  );
}

export default App;
