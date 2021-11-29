/**
 * File for lib things that don't depend on store or import it as type only.
 */
import { Action, miniSerializeError, ThunkAction } from '@reduxjs/toolkit';
import { DeepReadonly, Nullable } from '../lib/types';
import { Publications, getDefaultYearRange } from '../models/publications';
import {
  AnyTreeNode,
  createTreeRoot,
  SerializableTreeNode,
  SerializableTreeNodeMap,
  TreeNodeType,
} from '../models/publication-tree';
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
  SetYearRange = 'setYearRange',
  HoverNode = 'hover',
}

export type RootState = DeepReadonly<{
  data: {
    raw: Publications[];
    fullTree: SerializableTreeNode<TreeNodeType.Root>;
    idMap: SerializableTreeNodeMap;

    yearLimits: [number, number];
    yearRange: [number, number];
    filteredTree: SerializableTreeNode<TreeNodeType.Root>;

    rootId: string;
    treeParentIds: string[];

    selectedTree: Nullable<AnyTreeNode<any>>;
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

      yearLimits: getDefaultYearRange(),
      yearRange: getDefaultYearRange(),
      filteredTree: createTreeRoot(),

      rootId: '',
      treeParentIds: [],

      selectedTree: createTreeRoot(),
      selectedIds: {
        fully: [],
        half: [],
      },

      hoveredNodeId: null,
      hoveredNodeParentIds: null,
    },
  };
}

export function selectYearLimits(state: RootState): readonly [number, number] {
  return state.data.yearLimits as any;
}

export function selectYearRange(state: RootState): readonly [number, number] {
  return state.data.yearRange as any;
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
