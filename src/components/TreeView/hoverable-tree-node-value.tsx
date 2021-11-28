import { DataNode } from 'rc-tree/lib/interface';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { distinctUntilChanged, map } from 'rxjs';
import { when, whenT } from '../../lib/expressions';
import { asEffectReset } from '../../lib/rx';
import { DeepReadonly } from '../../lib/types';
import { AnyTreeNode } from '../../models/citation-tree';
import { useRxAppStore } from '../../store';
import { selectHoveredNodeId, selectHoveredNodeParentIds } from '../../store/constant-lib';
import { getHoveredNode } from './lib';
import './TreeView.scss';

export interface HoverableTreeNodeValueProps {
  data: DeepReadonly<AnyTreeNode<any>>;
}

export function HoverableTreeNodeValue({ data }: PropsWithChildren<HoverableTreeNodeValueProps>) {
  // const dataCloned = { ...data };
  const { store, state$ } = useRxAppStore();
  const state = store.getState();
  const [hoveredNode, setHoveredNode] = useState(getHoveredNode(state, selectHoveredNodeId(state)));
  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectHoveredNodeId), distinctUntilChanged()).subscribe((value) => {
          // const node = value === data.id ? getHoveredNode(state, value) : null;
          setHoveredNode(getHoveredNode(state, value));
          // if (node) {
          //   dataCloned.className = 'app-antd-tree-node-selected';
          // } else {
          //   delete dataCloned.className;
          // }
        })
      ),
    [state$, state, data.id]
  );
  const className = useMemo(
    () =>
      'app-antd-tree-node' +
      (hoveredNode && hoveredNode?.id
        ? whenT(
            [
              [data.id === hoveredNode.id, () => ' app-antd-tree-node-selected'],
              [selectHoveredNodeParentIds(state)?.has(data.id) ?? false, () => ' app-antd-tree-node-child-selected'],
            ],
            () => ''
          )
        : ''),
    [data.id, hoveredNode, state]
  );

  return <div className={className}>{data.name}</div>;
}
