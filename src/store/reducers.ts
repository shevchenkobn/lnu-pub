import { ActionReducerMapBuilder } from '@reduxjs/toolkit/src/mapBuilders';
import { Draft } from 'immer';
import { iterate } from 'iterare';
import { objectKeys } from '../lib/object';
import { DeepReadonly } from '../lib/types';
import {
  AnyTreeNode,
  getFilteredTree,
  SerializableTreeNodeMap,
  toSerializableCitationTree,
  toSerializableMap,
  traverseParents,
  TreeNodeParentable,
} from '../models/citation-tree';
import { selectIds, SelectIdsAction } from './actions/select-ids';
import { setRoot, SetRootIdAction } from './actions/set-root';
import { hoverNodeId, HoverNodeIdAction } from './actions/hover-node-id';
import { loadRaw, LoadRawAction } from './actions/load-raw';
import { getAssertedNode, RootState } from './constant-lib';

export type AppAction = LoadRawAction | SetRootIdAction | HoverNodeIdAction | SelectIdsAction;

export function buildReducers(builder: ActionReducerMapBuilder<RootState>) {
  builder
    .addCase(loadRaw.type, (state, action: LoadRawAction) => {
      state.data.raw = action.payload;
      state.data.fullTree = toSerializableCitationTree(state.data.raw);
      state.data.rootId = state.data.fullTree.id;
      state.data.idMap = toSerializableMap(state.data.fullTree);
      state.data.selectedIds = {
        fully: Object.keys(state.data.idMap),
        half: [],
      };
      state.data.filteredTree = state.data.fullTree;
      state.data.selectedTree = state.data.filteredTree;
      state.data.treeParentIds = getNodeParentPath(state.data.selectedTree, state.data.idMap);
    })
    .addCase(setRoot.type, (state, action: SetRootIdAction) => {
      const root = getAssertedNode(state, action.payload);
      state.data.rootId = root.id;
      replaceSelectedTree(state);
      state.data.treeParentIds = getNodeParentPath(root, state.data.idMap);
      state.data.hoveredNodeId = null;
      state.data.hoveredNodeParentIds = null;
    })
    .addCase(selectIds.type, (state, action: SelectIdsAction) => {
      state.data.selectedIds = {
        fully: iterate(action.payload.fully).toArray(),
        half: iterate(action.payload.half).toArray(),
      };
      replaceSelectedTree(state);
    })
    .addCase(hoverNodeId.type, (state, action: HoverNodeIdAction) => {
      const node = !action.payload ? null : getAssertedNode(state, action.payload);
      if (node) {
        state.data.hoveredNodeId = node.id;
        state.data.hoveredNodeParentIds = getNodeParentPath(node, state.data.idMap);
      } else {
        state.data.hoveredNodeId = null;
        state.data.hoveredNodeParentIds = null;
      }
    });
}

function replaceSelectedTree(state: Draft<RootState>) {
  const fullySelectedSet = new Set(state.data.selectedIds.fully);
  const halfSelectedSet = new Set(state.data.selectedIds.half);
  state.data.selectedTree = getFilteredTree(
    JSON.parse(JSON.stringify(state.data.idMap[state.data.rootId])),
    (node) => halfSelectedSet.has(node.id) || fullySelectedSet.has(node.id)
  );
}

function getNodeParentPath(node: DeepReadonly<AnyTreeNode<any>>, idMap: DeepReadonly<SerializableTreeNodeMap>) {
  return iterate(traverseParents(node, (id) => idMap[id] ?? null))
    .map((n) => n.id)
    .toArray();
}
