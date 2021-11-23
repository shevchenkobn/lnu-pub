import React from 'react';
import './App.scss';
import { SunburstChart } from './components/SunburstChart';
import { useAppStore } from './store';
import { loadRaw } from './store/reducers/loader';

function App() {
  const store = useAppStore();
  store.dispatch(loadRaw());

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
