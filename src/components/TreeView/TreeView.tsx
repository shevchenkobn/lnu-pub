import { Tree } from 'antd';
import { DataNode } from 'rc-tree/lib/interface';
import { useEffect, useMemo, useState } from 'react';
import { distinctUntilChanged, map } from 'rxjs';
import { asEffectReset } from '../../lib/rx';
import { DeepReadonly, DeepReadonlyArray, Nullable } from '../../lib/types';
import { AnyTreeNode } from '../../models/citation-tree';
import { useRxAppStore } from '../../store';
import { setRoot } from '../../store/actions/filter';
import { selectFullTree, selectTree } from '../../store/constant-lib';
import { HoverableTreeNodeValue } from './hoverable-tree-node-value';
import './TreeView.scss';

export function TreeView() {
  const { store, state$ } = useRxAppStore();
  const state = store.getState();
  const [fullTree, setFullTree] = useState(selectFullTree(state));
  const [treeRoot, setTreeRoot] = useState(selectTree(state));
  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectFullTree), distinctUntilChanged()).subscribe((value) => {
          setFullTree(value);
        })
      ),
    [state$]
  );
  useEffect(() =>
    asEffectReset(
      state$.pipe(map(selectTree), distinctUntilChanged()).subscribe((value) => {
        setTreeRoot(value);
      })
    )
  );
  const data = useMemo(() => toDataNodes(fullTree), [fullTree]);

  return (
    <Tree
      className="TreeView"
      selectedKeys={[treeRoot.id]}
      treeData={data}
      onSelect={(keys) => store.dispatch(setRoot(keys[0].toString()))}
    />
  );
}

interface DataNodesQueueEntry {
  parent: DataNode;
  children: Nullable<DeepReadonlyArray<AnyTreeNode<any>>>;
}

function toDataNodes(tree: DeepReadonly<AnyTreeNode<any>>): DataNode[] {
  const nodes: DataNode[] = [toDataNode(tree)];
  const queue: DataNodesQueueEntry[] = [{ parent: nodes[0], children: tree.children }];
  while (queue.length > 0) {
    const { parent, children } = queue[0];
    if (children) {
      if (!parent.children) {
        parent.children = [];
      }
      for (const child of children) {
        const node = toDataNode(child);
        parent.children.push(node);
        queue.push({ parent: node, children: child.children });
      }
    }
    queue.shift();
  }

  return nodes;
}

interface ReactTreeQueueEntry {
  parent: Nullable<ReactTreeQueueEntry>;
  children: ReadonlyArray<DataNode>;
}

function toDataNode(node: DeepReadonly<AnyTreeNode<any>>): DataNode {
  return {
    checkable: false,
    disabled: false,
    disableCheckbox: false,
    key: node.id,
    title: <HoverableTreeNodeValue data={node} />,
    selectable: !!node.children,
  };
}
