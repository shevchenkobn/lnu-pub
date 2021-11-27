import React from 'react';
import './App.scss';
import { SunburstChart } from './components/SunburstChart';
import { useAppStore } from './store';
import { hoverNodeId } from './store/actions/hover-node.id';
import { loadRaw } from './store/actions/load-raw';

function App() {
  console.log('wtf render');
  const store = useAppStore();
  store.dispatch(loadRaw());
  setTimeout(() => {
    store.dispatch(hoverNodeId('dSPR'));
  }, 2000);
  // setTimeout(() => {
  //   store.dispatch(hoverNodeId('uLNU'));
  // }, 4000);

  return (
    <div className="App">
      <header className="App-header">
        <SunburstChart />
        {/*<p>*/}
        {/*  Edit <code>src/App.tsx</code> and save to reload.*/}
        {/*</p>*/}
        {/*<a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">*/}
        {/*  Learn React*/}
        {/*</a>*/}
      </header>
    </div>
  );
}

export default App;
