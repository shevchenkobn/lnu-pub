/**
 * File for lib things that don't depend on store or import it as type only.
 */
import { Action, miniSerializeError, ThunkAction } from '@reduxjs/toolkit';
import { DeepReadonly } from '../lib/types';
import { Citation } from '../models/citation';
import { SerializableTreeNode, TreeNodeType } from '../models/citation-tree';
import { createAppStore } from './index';

export type AppStore = ReturnType<typeof createAppStore>;
export const serializeStoreError = miniSerializeError;
export type AppDispatch = AppStore['dispatch'];
export type RootState = DeepReadonly<{
  data: {
    raw: Citation[];
    allGrouped: SerializableTreeNode<TreeNodeType.Root>;
    grouped: SerializableTreeNode<Exclude<TreeNodeType, TreeNodeType.Person>>;
  };
}>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

export interface ActionWithPayload<T> extends Action<string> {
  payload: T;
}

export enum ActionType {
  Load = 'load',
  Filter = 'filter',
}
