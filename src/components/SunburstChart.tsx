import { useEffect, useState } from 'react';
import { asEffectReset } from '../lib/rx';
import { DeepReadonly } from '../lib/types';
import { cloneShallow, FlatTreeNode, toArray } from '../models/citation-tree';
import { selectGrouped, useRxAppStore } from '../store';
import { map } from 'rxjs';
import * as ReactVega from 'react-vega';
import type { Spec } from 'vega';
import { setRoot } from '../store/reducers/filter';

const dataSetName = 'tree';
const nodeClickSignal = 'nodeClick';
const Chart = ReactVega.createClassFromSpec({
  mode: 'vega',
  spec: {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'An citation tree.',
    width: 600,
    height: 600,
    padding: 5,
    autosize: 'none',
    scales: [
      {
        name: 'color',
        type: 'ordinal',
        domain: { data: 'tree', field: 'depth' },
        range: { scheme: 'tableau20' },
      },
    ],
    data: [
      {
        name: dataSetName,
        transform: [
          {
            type: 'stratify',
            key: 'id',
            parentKey: 'parent',
          },
          {
            type: 'partition',
            field: 'value',
            sort: { field: 'value' },
            size: [{ signal: '2 * PI' }, { signal: 'width / 2' }],
            as: ['a0', 'r0', 'a1', 'r1', 'depth', 'children'],
          },
        ],
      },
    ],
    marks: [
      {
        type: 'arc',
        from: { data: 'tree' },
        encode: {
          enter: {
            x: { signal: 'width / 2' },
            y: { signal: 'height / 2' },
            fill: { scale: 'color', field: 'depth' },
            tooltip: {
              signal: "datum.name + ' - ' + (datum.groupedValue || datum.value) + ' publications'",
            },
          },
          update: {
            startAngle: { field: 'a0' },
            endAngle: { field: 'a1' },
            innerRadius: { field: 'r0' },
            outerRadius: { field: 'r1' },
            stroke: { value: 'white' },
            strokeWidth: { value: 0.5 },
            zindex: { value: 0 },
          },
          hover: {
            stroke: { value: 'red' },
            cursor: { signal: 'hoverNonLeafCursor' },
            strokeWidth: { value: 2 },
            zindex: { value: 1 },
          },
        },
      },
    ],
    signals: [
      {
        name: 'hoverNonLeafCursor',
        on: [
          {
            events: '*:mouseover',
            update: 'isNumber(datum.groupedValue) ? "pointer" : "inherit"',
          },
        ],
      },
      {
        name: nodeClickSignal,
        on: [
          {
            events: {
              type: 'click',
              filter: ['item().datum', 'isNumber(item().datum.groupedValue)'],
            },

            update: 'datum',
            force: true,
          },
        ],
      },
    ],
  } as Spec,
});

export function SunburstChart() {
  const { store, state$ } = useRxAppStore();
  const [grouped, setGrouped] = useState(selectGrouped(store.getState()));
  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectGrouped)).subscribe((value) => {
          const newValue = cloneShallow(value);
          newValue.parent = null;
          setGrouped(newValue);
        })
      ),
    [state$, grouped]
  );
  const data = toArray(grouped);
  console.log('grouped', grouped, data);
  return (
    <Chart
      data={{ [dataSetName]: data }}
      onNewView={(view) => {
        view.addSignalListener(nodeClickSignal, (_, datum: DeepReadonly<FlatTreeNode<any>>) => {
          console.log('clicked', datum);
          store.dispatch(setRoot(datum.id));
        });
        // setTimeout(() => {
        //   // view
        // }, 1000);
      }}
    />
  );
}
