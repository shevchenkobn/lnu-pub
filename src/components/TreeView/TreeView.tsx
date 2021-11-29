import { Tree } from 'antd';
import { iterate } from 'iterare';
import { DataNode } from 'rc-tree/lib/interface';
import { useEffect, useMemo, useState } from 'react';
import { distinctUntilChanged, map } from 'rxjs';
import { asEffectReset } from '../../lib/rx';
import { DeepReadonly, DeepReadonlyArray, Nullable } from '../../lib/types';
import { AnyTreeNode } from '../../models/publication-tree';
import { useRxAppStore } from '../../store';
import { selectIds } from '../../store/actions/select-ids';
import { setRoot } from '../../store/actions/set-root';
import { selectFilteredTree, selectRootId, selectSelectedIds } from '../../store/constant-lib';
import { HoverableTreeNodeValue } from './HoverableTreeNodeValue';
import './TreeView.scss';

export function TreeView() {
  const { store, state$ } = useRxAppStore();
  const state = store.getState();
  const [filteredTree, setFilteredTree] = useState(selectFilteredTree(state));
  const [selectedIds, setSelectedIds] = useState(selectSelectedIds(state));
  const [rootId, setRootId] = useState(selectRootId(state));
  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectFilteredTree), distinctUntilChanged()).subscribe((value) => {
          setFilteredTree(value);
        })
      ),
    [state$]
  );
  useEffect(() =>
    asEffectReset(
      state$.pipe(map(selectSelectedIds), distinctUntilChanged()).subscribe((value) => {
        setSelectedIds(value);
      })
    )
  );
  useEffect(() =>
    asEffectReset(
      state$.pipe(map(selectRootId), distinctUntilChanged()).subscribe((value) => {
        setRootId(value);
      })
    )
  );
  const data = useMemo(() => toDataNodes(filteredTree), [filteredTree]);

  return (
    <Tree
      checkable
      onCheck={(keys, info) => {
        return store.dispatch(
          selectIds(
            'checked' in keys
              ? {
                  fully: asStringIterator(keys.checked),
                  half: asStringIterator(keys.halfChecked),
                }
              : {
                  fully: asStringIterator(keys),
                  half: asStringIterator(info.halfCheckedKeys ?? []),
                }
          )
        );
      }}
      checkedKeys={{
        checked: selectedIds.fully.slice(),
        halfChecked: selectedIds.half.slice(),
      }}
      showLine={{ showLeafIcon: false }}
      className="TreeView"
      selectedKeys={[rootId]}
      treeData={data}
      onSelect={(keys) => {
        if (keys.length === 0) {
          return;
        }
        store.dispatch(setRoot(keys[0].toString()));
      }}
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

function toDataNode(node: DeepReadonly<AnyTreeNode<any>>): DataNode {
  return {
    disabled: false,
    disableCheckbox: false,
    key: node.id,
    title: <HoverableTreeNodeValue data={node} />,
    selectable: !!node.children,
  };
}

function asStringIterator(source: Iterator<any> | Iterable<any>) {
  return iterate(source).map((v) => v.toString());
}
