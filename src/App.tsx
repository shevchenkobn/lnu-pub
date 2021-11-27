import Col from 'antd/lib/col';
import Row from 'antd/lib/row';
import React from 'react';
import './App.scss';
import { fitAllCharts, SunburstChart } from './components/SunburstChart';
import { TreeView } from './components/TreeView';
import { useAppStore } from './store';
import { loadRaw } from './store/actions/load-raw';

function App() {
  const store = useAppStore();
  store.dispatch(loadRaw());
  fitAllCharts();

  return (
    <Row className="App">
      <Col span={12}>
        <TreeView />
      </Col>
      <Col span={12}>
        <SunburstChart />
        {/*height={Number.parseInt(scss.heightPx)}*/}
      </Col>
    </Row>
  );
}

export default App;
