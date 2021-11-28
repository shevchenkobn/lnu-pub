import { createAction } from '@reduxjs/toolkit';
import { DeepReadonly } from '../../lib/types';
import { ActionType } from '../constant-lib';

export interface SelectedIds {
  readonly fully: Iterator<string> | Iterable<string>;
  readonly half: Iterator<string> | Iterable<string>;
}

export type SelectIdsAction = ReturnType<typeof selectIds>;

export const selectIds = createAction<SelectedIds>(ActionType.SelectIds);
