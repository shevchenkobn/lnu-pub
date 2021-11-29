import { Space } from 'antd';
import Title from 'antd/es/typography/Title';
import Col from 'antd/lib/col';
import Row from 'antd/lib/row';
import React from 'react';
import './App.scss';
import { Filters } from './components/Filters';
import { fitAllCharts, SunburstChart } from './components/SunburstChart';
import { TreeView } from './components/TreeView/TreeView';
import { useAppStore } from './store';
import { loadRaw } from './store/actions/load-raw';

function App() {
  const store = useAppStore();
  store.dispatch(loadRaw());
  fitAllCharts();

  return (
    <div className="App">
      <Space className={'w-100'} direction={'vertical'} align={'center'}>
        <Title>Publication Analysis Tool.</Title>
      </Space>
      <div className={'mb-1'}>
        <Filters />
      </div>
      <Row className="main" gutter={24}>
        <Col span={12} className="tree-view">
          <TreeView />
        </Col>
        <Col span={12}>
          <SunburstChart />
        </Col>
      </Row>
    </div>
  );
}

export default App;
