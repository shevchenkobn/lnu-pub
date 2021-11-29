import { ActionReducerMapBuilder } from '@reduxjs/toolkit/src/mapBuilders';
import { Draft } from 'immer';
import { iterate } from 'iterare';
import { cloneDeep } from 'lodash-es';
import { objectKeys } from '../lib/object';
import { DeepReadonly, DeepReadonlyArray, t } from '../lib/types';
import { Publications, getDefaultYearRange } from '../models/publications';
import {
  AnyTreeNode,
  traversePostOrder,
  getFilteredTree,
  SerializableTreeNode,
  SerializableTreeNodeMap,
  toSerializablePublicationTree,
  traverseParents,
  traversePreOrder,
  TreeNodeParentable,
  TreeNodeType,
  updateYears,
} from '../models/publication-tree';
import { selectIds, SelectIdsAction } from './actions/select-ids';
import { setRoot, SetRootIdAction } from './actions/set-root';
import { hoverNodeId, HoverNodeIdAction } from './actions/hover-node-id';
import { loadRaw, LoadRawAction } from './actions/load-raw';
import { applyYearRange, ApplyYearRangeAction } from './actions/apply-year-range';
import { getAssertedNode, RootState } from './constant-lib';

export type AppAction = LoadRawAction | SetRootIdAction | HoverNodeIdAction | SelectIdsAction | ApplyYearRangeAction;

export function buildReducers(builder: ActionReducerMapBuilder<RootState>) {
  builder
    .addCase(loadRaw.type, (state, action: LoadRawAction) => {
      state.data.raw = action.payload;
      state.data.idMap = {};
      state.data.fullTree = toSerializablePublicationTree(state.data.raw, state.data.idMap as SerializableTreeNodeMap);
      for (const node of traversePreOrder(state.data.fullTree)) {
        if (!node.children) {
          continue;
        }
        node.children.sort((a, b) => a.name.localeCompare(b.name));
      }

      state.data.rootId = state.data.fullTree.id;

      state.data.yearLimits = getYearRange(state.data.raw);
      state.data.yearRange = getYearRange(state.data.raw);
      state.data.filteredTree = state.data.fullTree;

      state.data.selectedIds = {
        fully: Object.keys(state.data.idMap),
        half: [],
      };
      state.data.selectedTree = state.data.filteredTree;

      state.data.treeParentIds = getNodeParentPath(state.data.selectedTree, state.data.idMap);
    })
    .addCase(applyYearRange.type, (state, action: ApplyYearRangeAction) => {
      const range = action.payload;
      const tree = getFilteredTree(
        state.data.fullTree,
        (n) => Math.max(n.years[0], range[0]) <= Math.min(n.years[1], range[1])
      );
      if (!tree || tree.type !== TreeNodeType.Root) {
        console.error('Unexpected non-root or empty filtered tree!');
        return;
      }
      state.data.filteredTree = tree as SerializableTreeNode<TreeNodeType.Root>;
      recalculateTreeValues(state.data.filteredTree as SerializableTreeNode<TreeNodeType.Root>);

      state.data.yearRange = range.slice();

      replaceSelectedTree(state);
    })
    .addCase(setRoot.type, (state, action: SetRootIdAction) => {
      const root = getAssertedNode(state, action.payload);
      state.data.rootId = root.id;
      state.data.treeParentIds = getNodeParentPath(root, state.data.idMap);

      replaceSelectedTree(state);

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

function getYearRange(tree: DeepReadonlyArray<Publications>) {
  const range = t(Number.MAX_VALUE, Number.MIN_VALUE);
  for (const publications of tree) {
    updateYears(range, publications.year);
  }
  return range;
}

function replaceSelectedTree(state: Draft<RootState>) {
  const root = iterate(traversePreOrder(state.data.filteredTree))
    .filter((n) => n.id === state.data.rootId)
    .take(1)
    .toArray()[0];
  // state.data.rootId === state.data.fullTree.id
  //   ? state.data.idMap[state.data.rootId]
  //   : iterate(traversePreOrder(state.data.filteredTree))
  //       .filter((n) => n.id === state.data.rootId)
  //       .take(1)
  //       .toArray()[0];
  const fullySelectedSet = new Set(state.data.selectedIds.fully);
  const halfSelectedSet = new Set(state.data.selectedIds.half);
  state.data.selectedTree = getFilteredTree(
    root,
    (node) => halfSelectedSet.has(node.id) || fullySelectedSet.has(node.id)
  );
  if (state.data.selectedTree) {
    recalculateTreeValues(state.data.selectedTree as AnyTreeNode<any>);
  }
}

function getNodeParentPath(node: DeepReadonly<AnyTreeNode<any>>, idMap: DeepReadonly<SerializableTreeNodeMap>) {
  return iterate(traverseParents(node, (id) => idMap[id] ?? null))
    .map((n) => n.id)
    .toArray();
}

function recalculateTreeValues(tree: AnyTreeNode<any>) {
  for (const node of traversePostOrder(tree)) {
    if (!node.children) {
      continue;
    }
    node.value = 0;
    node.years = [Number.MAX_VALUE, Number.MIN_VALUE];
    for (const child of node.children) {
      node.value += child.value;
      for (const year of child.years) {
        updateYears(node.years, year);
      }
    }
  }
}
