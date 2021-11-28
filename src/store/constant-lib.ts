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
  SelectIds = 'selectIds',
  HoverNode = 'hover',
}

export type RootState = DeepReadonly<{
  data: {
    raw: Citation[];
    fullTree: SerializableTreeNode<TreeNodeType.Root>;
    idMap: SerializableTreeNodeMap;
    filteredTree: SerializableTreeNode<TreeNodeType.Root>;
    selectedTree: Nullable<AnyTreeNode<any>>;
    rootId: string;
    treeParentIds: string[];
    selectedIds: {
      fully: string[];
      half: string[];
    };
    hoveredNodeId: Nullable<string>;
    hoveredNodeParentIds: Nullable<string[]>;
  };
}>;

export function getInitialState(): RootState {
  return {
    data: {
      raw: [],
      fullTree: createTreeRoot(),
      idMap: {},
      filteredTree: createTreeRoot(),
      selectedTree: createTreeRoot(),
      rootId: '',
      treeParentIds: [],
      selectedIds: {
        fully: [],
        half: [],
      },
      hoveredNodeId: null,
      hoveredNodeParentIds: null,
    },
  };
}

export function selectFilteredTree(state: RootState) {
  return state.data.filteredTree;
}

export function selectSelectedTree(state: RootState) {
  return state.data.selectedTree;
}

export function selectSelectedIds(state: RootState) {
  return state.data.selectedIds;
}

export function selectTreeParentIds(state: RootState) {
  return state.data.treeParentIds;
}

export function selectHoveredNodeId(state: RootState) {
  return state.data.hoveredNodeId;
}

export function selectRootId(state: RootState) {
  return state.data.rootId;
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
