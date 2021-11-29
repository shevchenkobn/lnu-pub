import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { View } from 'react-vega';
import { asEffectReset } from '../lib/rx';
import { DeepReadonly, DeepReadonlyArray, Nullable } from '../lib/types';
import {
  AnyTreeNode,
  cloneShallow,
  FlatTreeNode,
  NonLeafTreeNodeType,
  SerializableTreeNode,
  toArray,
  toFlatNode,
  TreeNodeType,
} from '../models/publication-tree';
import { Point } from '../models/common';
import { useRxAppStore } from '../store';
import { distinctUntilChanged, map } from 'rxjs';
import * as ReactVega from 'react-vega';
import type { Spec } from 'vega';
import { setRoot } from '../store/actions/set-root';
import { hoverNodeId } from '../store/actions/hover-node-id';
import {
  getAssertedNode,
  RootState,
  selectSelectedTree,
  selectHoveredNodeParentIds,
  selectHoveredNodeId,
} from '../store/constant-lib';
import classNames from './SunburstChart.module.scss';
import scssCore from '../core.module.scss';

const dataSetName = 'tree';

const nodeClickSignal = 'nodeClicked';
const nodeHoverSignal = 'nodeHovered';
const nonLeafHoveredSignal = 'nonLeafHovered';
const widthSignal = 'width';
const heightSignal = 'height';

const defaultWidth = 600;
const defaultHeight = 600;

const Chart = ReactVega.createClassFromSpec({
  mode: 'vega',
  spec: {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A publication tree.',
    width: { signal: widthSignal },
    height: { signal: heightSignal },
    padding: 0,
    autosize: {
      type: 'fit',
      contains: 'padding',
      resize: true,
    },
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
        name: widthSignal,
        value: defaultWidth,
        on: [{ events: 'window:resize', update: `containerSize()[0] || ${defaultWidth}` }],
      },
      {
        name: heightSignal,
        value: defaultHeight,
        on: [{ events: 'window:resize', update: `containerSize()[1] || ${defaultHeight}` }],
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
            stroke: [
              { test: `${nodeHoverSignal}.id == datum.id`, value: scssCore.nodeHighlightBorderColor },
              { value: 'white' },
            ],
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

export interface SunburstChartProps {
  width?: number;
  height?: number;
}

// const set = new WeakSet();
export function SunburstChart({ width, height }: PropsWithChildren<SunburstChartProps>) {
  const { store, state$ } = useRxAppStore();
  const viewRef = useRef<Nullable<View>>(null);
  const [data, setData] = useState(mapTree(selectSelectedTree(store.getState())));

  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectSelectedTree), distinctUntilChanged()).subscribe((value) => {
          setData(mapTree(value));
        })
      ),
    [state$, data]
  );
  // console.info('render chart', tree, set.has(tree));
  // set.add(tree);
  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectHoveredNodeId), distinctUntilChanged()).subscribe((value) => {
          if (!viewRef.current) {
            console.error('Failed to show hovered node, view is not initialized!');
            return;
          }
          viewRef.current
            .signal(nodeHoverSignal, getFlatNode(store.getState(), value))
            .runAsync()
            .catch((error) => console.error('Failed to highlight node:', getFlatNode(store.getState(), value), error));
        })
      ),
    [state$, store]
  );

  return (
    <Chart
      className={classNames.SunburstChart}
      data={{ [dataSetName]: data }}
      onNewView={(view) => {
        viewRef.current = view;
        console.log('[chart] assign view', view);

        view.addSignalListener(nodeClickSignal, (_, datum: DeepReadonly<FlatTreeNode<any>>) => {
          if (selectSelectedTree(store.getState())?.id === datum.id) {
            return;
          }
          store.dispatch(setRoot(datum.id));
        });
        view.addSignalListener(nodeHoverSignal, (_, datum: DeepReadonly<FlatTreeNode<any>>) => {
          if (selectHoveredNodeId(store.getState()) === datum.id) {
            return;
          }
          store.dispatch(hoverNodeId(datum.id));
        });
      }}
    />
  );
}

function mapTree(tree: Nullable<DeepReadonly<AnyTreeNode<any>>>): FlatTreeNode<any>[] {
  if (!tree) {
    return [];
  }
  const newValue = cloneShallow(tree);
  newValue.parent = null;
  newValue.children = tree.children ? (tree.children.slice() as AnyTreeNode<any>[]) : null;
  return toArray(newValue);
}

function getFlatNode(state: RootState, nodeId: Nullable<string>) {
  return nodeId ? toFlatNode(getAssertedNode(state, nodeId)) : { id: null };
}

export function fitAllCharts() {
  setTimeout(() => window.dispatchEvent(new Event('resize')));
}
