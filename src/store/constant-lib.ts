/**
 * File for lib things that don't depend on store or import it as type only.
 */
import { Action, miniSerializeError, ThunkAction } from '@reduxjs/toolkit';
import { DeepReadonly, Nullable } from '../lib/types';
import { Citation } from '../models/citation';
import {
  AnyTreeNode,
  createTreeRoot,
  NonLeafTreeNodeType,
  SerializableTreeNode,
  SerializableTreeNodeMap,
  TreeNodeType,
} from '../models/citation-tree';
import { createAppStore } from './index';

export type AppStore = ReturnType<typeof createAppStore>;
export const serializeStoreError = miniSerializeError;
export type AppDispatch = AppStore['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

export interface ActionWithPayload<T> extends Action<string> {
  payload: T;
}

export enum ActionType {
  LoadRaw = 'loadRaw',
  SetTreeRoot = 'setRoot',
  HoverNode = 'hover',
}

export type RootState = DeepReadonly<{
  data: {
    raw: Citation[];
    fullTree: SerializableTreeNode<TreeNodeType.Root>;
    idMap: SerializableTreeNodeMap;
    tree: AnyTreeNode<any>;
    hoveredNodeId: Nullable<string>;
    hoveredNodeParentIds: Nullable<ReadonlySet<string>>;
  };
}>;

export function getInitialState(): RootState {
  return {
    data: {
      raw: [],
      fullTree: createTreeRoot(),
      tree: createTreeRoot(),
      idMap: {},
      hoveredNodeId: null,
      hoveredNodeParentIds: null,
    },
  };
}

export function selectFullTree(state: RootState) {
  return state.data.fullTree;
}

export function selectTree(state: RootState) {
  return state.data.tree;
}

export function selectHoveredNodeId(state: RootState) {
  return state.data.hoveredNodeId;
}

export function selectHoveredNodeParentIds(state: RootState) {
  return state.data.hoveredNodeParentIds;
}

export function getAssertedNode(state: RootState, nodeId: string): DeepReadonly<AnyTreeNode<any>> {
  const tree = state.data.idMap[nodeId];
  if (!tree) {
    throw new TypeError(`Tree with ID ${nodeId} does not exist!`);
  }
  return tree;
}
