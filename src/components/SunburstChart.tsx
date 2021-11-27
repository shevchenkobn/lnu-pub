import { useEffect, useState } from 'react';
import { asEffectReset } from '../lib/rx';
import { DeepReadonly, Nullable } from '../lib/types';
import {
  cloneShallow,
  FlatTreeNode,
  SerializableTreeNode,
  toArray,
  toFlatNode,
  TreeNodeType,
} from '../models/citation-tree';
import { useRxAppStore } from '../store';
import { distinct, map } from 'rxjs';
import * as ReactVega from 'react-vega';
import type { Spec } from 'vega';
import { setRoot } from '../store/actions/filter';
import { hoverNodeId } from '../store/actions/hover-node.id';
import { getAssertedNode, RootState, selectGrouped, selectHoveredNodeId } from '../store/constant-lib';

const dataSetName = 'tree';

const nodeClickSignal = 'nodeClicked';
const nodeHoverSignal = 'nodeHovered';
const nonLeafHoveredSignal = 'nonLeafHovered';

interface NoHoveredNode {
  id: null;
}

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
    signals: [
      {
        name: nodeHoverSignal,
        value: {
          id: null,
        },
        on: [
          {
            events: 'mouseover',
            update: 'datum || { id: null }',
          },
        ],
      },
      {
        name: nonLeafHoveredSignal,
        on: [
          {
            events: { signal: nodeHoverSignal },
            update: `isNumber(${nodeHoverSignal}.groupedValue)`,
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
            stroke: [{ test: `${nodeHoverSignal}.id == datum.id`, value: 'red' }, { value: 'white' }],
            strokeWidth: [{ test: `${nodeHoverSignal}.id == datum.id`, value: 2 }, { value: 0.5 }],
            zindex: [{ test: `${nodeHoverSignal}.id == datum.id`, value: 1 }, { value: 0 }],
          },
          hover: {
            cursor: [{ test: nonLeafHoveredSignal, value: 'pointer' }, { value: 'inherit' }],
          },
        },
      },
    ],
  } as Spec,
});

export function SunburstChart() {
  const { store, state$ } = useRxAppStore();
  const state = store.getState();
  const hoveredNodeId = selectHoveredNodeId(state);
  const [data, setData] = useState<FlatTreeNode<any>[]>(mapGrouped(selectGrouped(state)));
  const [hoveredNode, setHoveredNode] = useState<FlatTreeNode<any> | NoHoveredNode>(getFlatNode(state, hoveredNodeId));
  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectGrouped), distinct()).subscribe((value) => {
          setData(mapGrouped(value));
        })
      ),
    [state$, data]
  );
  console.log('render', hoveredNode);
  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectHoveredNodeId), distinct()).subscribe((value) => {
          console.log('state$ nodeId', value);
          setHoveredNode(getFlatNode(state, value));
        })
      ),
    [state$, hoveredNode, state]
  );
  return (
    <Chart
      data={{ [dataSetName]: data }}
      onNewView={(view) => {
        console.log('onNewView node', hoveredNode);
        // setTimeout(() => {
        //   console.log('callback');
        //   setData([...data]);
        // }, 3000);

        view
          .signal(nodeHoverSignal, hoveredNode)
          .runAsync()
          .catch((error) => console.error('Failed to render on hover:', error));

        view.addSignalListener(nodeClickSignal, (_, datum: DeepReadonly<FlatTreeNode<any>>) => {
          if (state.data.tree.id === datum.id) {
            return;
          }
          store.dispatch(setRoot(datum.id));
        });
        view.addSignalListener(nodeHoverSignal, (_, datum: DeepReadonly<FlatTreeNode<any>>) => {
          if (hoveredNode.id === datum.id) {
            return;
          }
          store.dispatch(hoverNodeId(datum.id));
        });
      }}
    />
  );
}

function mapGrouped(
  tree: DeepReadonly<SerializableTreeNode<Exclude<TreeNodeType, TreeNodeType.Person>>>
): FlatTreeNode<any>[] {
  const newValue = cloneShallow(tree);
  newValue.parent = null;
  return toArray(newValue);
}

function getFlatNode(state: RootState, nodeId: Nullable<string>) {
  return nodeId ? toFlatNode(getAssertedNode(state, nodeId)) : { id: null };
}
