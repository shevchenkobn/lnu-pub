import React, { useEffect } from 'react';
import './App.scss';
import { SunburstChart } from './components/SunburstChart';
import { useAppStore } from './store';
import { hoverNodeId } from './store/actions/hover-node.id';
import { loadRaw } from './store/actions/load-raw';

function App() {
  console.log('wtf render');
  const store = useAppStore();
  store.dispatch(loadRaw());

  return (
    <div className="App">
      <SunburstChart />
      {/*<header className="App-header">*/}
      {/*  <p>*/}
      {/*    Edit <code>src/App.tsx</code> and save to reload.*/}
      {/*  </p>*/}
      {/*  <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">*/}
      {/*    Learn React*/}
      {/*  </a>*/}
      {/*</header>*/}
      <button onClick={() => store.dispatch(hoverNodeId('dSPR'))}>Dep</button>
      <button onClick={() => store.dispatch(hoverNodeId('uLNU'))}>Uni</button>
      <button onClick={() => store.dispatch(hoverNodeId(null))}>No</button>
    </div>
  );
}

export default App;
