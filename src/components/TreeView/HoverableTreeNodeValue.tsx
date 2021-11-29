import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { distinctUntilChanged, map } from 'rxjs';
import { whenT } from '../../lib/expressions';
import { asEffectReset } from '../../lib/rx';
import { DeepReadonly } from '../../lib/types';
import { AnyTreeNode } from '../../models/publication-tree';
import { useRxAppStore } from '../../store';
import { hoverNodeId } from '../../store/actions/hover-node-id';
import { selectHoveredNodeId, selectHoveredNodeParentIds, selectTreeParentIds } from '../../store/constant-lib';
import { getHoveredNode } from './lib';
import './TreeView.scss';

export interface HoverableTreeNodeValueProps {
  data: DeepReadonly<AnyTreeNode<any>>;
}

export function HoverableTreeNodeValue({ data }: PropsWithChildren<HoverableTreeNodeValueProps>) {
  const { store, state$ } = useRxAppStore();
  const state = store.getState();
  const [hoveredNode, setHoveredNode] = useState(getHoveredNode(state, selectHoveredNodeId(state)));
  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectHoveredNodeId), distinctUntilChanged()).subscribe((value) => {
          setHoveredNode(getHoveredNode(state, value));
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
              [
                selectHoveredNodeParentIds(state)?.includes(data.id) ?? false,
                () => ' app-antd-tree-node-child-selected',
              ],
            ],
            () => ''
          )
        : ''),
    [data.id, hoveredNode, state]
  );

  const value = `${data.name} - ${data.value} publications`;
  return (
    <div
      onMouseEnter={() => store.dispatch(hoverNodeId(data.id))}
      onMouseLeave={() => store.dispatch(hoverNodeId(null))}
      className={className}
    >
      {selectTreeParentIds(state).includes(data.id) ? <strong>{value}</strong> : value}
    </div>
  );
}
