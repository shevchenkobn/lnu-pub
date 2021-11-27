import { ActionReducerMapBuilder } from '@reduxjs/toolkit/src/mapBuilders';
import { toSerializableCitationTree, toSerializableMap } from '../models/citation-tree';
import { setRoot, SetRootAction } from './actions/filter';
import { hoverNodeId, HoverNodeIdAction } from './actions/hover-node.id';
import { loadRaw, LoadRawAction } from './actions/load-raw';
import { getAssertedNode, RootState } from './constant-lib';

export function buildReducers(builder: ActionReducerMapBuilder<RootState>) {
  builder
    .addCase(loadRaw.type, (state, action: LoadRawAction) => {
      state.data.raw = action.payload;
      state.data.fullTree = toSerializableCitationTree(state.data.raw);
      state.data.tree = state.data.fullTree;
      state.data.idMap = toSerializableMap(state.data.fullTree);
    })
    .addCase(setRoot.type, (state, action: SetRootAction) => {
      state.data.tree = getAssertedNode(state, action.payload);
    })
    .addCase(hoverNodeId.type, (state, action: HoverNodeIdAction) => {
      console.log('reducing hover', action.payload);
      // debugger;
      state.data.hoveredNodeId = !action.payload ? null : getAssertedNode(state, action.payload).id;
    });
}
