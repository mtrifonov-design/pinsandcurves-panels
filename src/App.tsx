import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import SignalList from './SignalList';
import EditingArea from './EditingArea';
const Default = () => <h1>Default Page</h1>;


function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Default />} />
        <Route path="/signals" element={<SignalList />} />
        <Route path="/editing" element={<EditingArea />} />
      </Routes>
    </div>
  );
}

export default App;
