import { ActionReducerMapBuilder } from '@reduxjs/toolkit/src/mapBuilders';
import { iterate } from 'iterare';
import { AnyTreeNode, toSerializableCitationTree, toSerializableMap, traverseParents } from '../models/citation-tree';
import { setRoot, SetRootIdAction } from './actions/filter';
import { hoverNodeId, HoverNodeIdAction } from './actions/hover-node-id';
import { loadRaw, LoadRawAction } from './actions/load-raw';
import { getAssertedNode, RootState } from './constant-lib';

export type AppAction = LoadRawAction | SetRootIdAction | HoverNodeIdAction;

export function buildReducers(builder: ActionReducerMapBuilder<RootState>) {
  builder
    .addCase(loadRaw.type, (state, action: LoadRawAction) => {
      state.data.raw = action.payload;
      state.data.fullTree = toSerializableCitationTree(state.data.raw);
      state.data.tree = state.data.fullTree;
      state.data.idMap = toSerializableMap(state.data.fullTree);
    })
    .addCase(setRoot.type, (state, action: SetRootIdAction) => {
      state.data.tree = getAssertedNode(state, action.payload) as AnyTreeNode<any>;
      state.data.hoveredNodeId = null;
      state.data.hoveredNodeParentIds = null;
    })
    .addCase(hoverNodeId.type, (state, action: HoverNodeIdAction) => {
      const node = !action.payload ? null : getAssertedNode(state, action.payload);
      if (node) {
        state.data.hoveredNodeId = node.id;
        state.data.hoveredNodeParentIds = iterate(traverseParents(node, (id) => state.data.idMap[id] ?? null))
          .map((n) => n.id)
          .toArray()
          .reduceRight((set, id) => {
            set.add(id);
            return set;
          }, new Set<string>());
      } else {
        state.data.hoveredNodeId = null;
        state.data.hoveredNodeParentIds = null;
      }
    });
}
